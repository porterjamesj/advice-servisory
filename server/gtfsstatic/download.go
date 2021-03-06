package gtfsstatic

import (
  "archive/zip"
  "io"
  "log"
  "net/http"
  "os"
  "path/filepath"
)

func RoutesLocation() (string, error) {
  if _, err := os.Stat("/tmp/mta/routes.txt"); os.IsNotExist(err) {
    err := download()
    if err != nil {
      return "", err
    }
  }

  return "/tmp/mta/routes.txt", nil
}

func StopsLocation() (string, error) {
  if _, err := os.Stat("/tmp/mta/stops.txt"); os.IsNotExist(err) {
    err := download()
    if err != nil {
      return "", err
    }
  }

  return "/tmp/mta/stops.txt", nil
}

func LinesLocation() (string, error) {
  if _, err := os.Stat("/tmp/mta/shapes.txt"); os.IsNotExist(err) {
    err := download()
    if err != nil {
      return "", err
    }
  }

  return "/tmp/mta/shapes.txt", nil
}

func download() error {
  log.Println("Static GTFS files do not exist, downloading to /tmp")

  if _, err := os.Stat("/tmp/mta"); os.IsNotExist(err) {
    err = os.Mkdir("/tmp/mta", os.ModePerm)
    if err != nil {
      return err
    }
  }

  out, err := os.Create("/tmp/mta/static.zip")
  if err != nil {
    return err
  }
  defer out.Close()

  // download ZIPed data
  resp, err := http.Get("http://web.mta.info/developers/data/nyct/subway/google_transit.zip")
  if err != nil {
    return err
  }
  defer resp.Body.Close()

  _, err = io.Copy(out, resp.Body)
  if err != nil {
    return err
  }

  _, err = unzip("/tmp/mta/static.zip", "/tmp/mta")
  if err != nil {
    return err
  }

  return nil
}

// Unzip will decompress a zip archive, moving all files and folders
// within the zip file (parameter 1) to an output directory (parameter 2).
func unzip(src string, dest string) ([]string, error) {

  var filenames []string

  r, err := zip.OpenReader(src)
  if err != nil {
    return filenames, err
  }
  defer r.Close()

  for _, f := range r.File {
    rc, err := f.Open()
    if err != nil {
      return filenames, err
    }
    defer rc.Close()

    // Store filename/path for returning and using later on
    fpath := filepath.Join(dest, f.Name)
    filenames = append(filenames, fpath)

    if f.FileInfo().IsDir() {
      // Make Folder
      os.MkdirAll(fpath, os.ModePerm)

    } else {
      // Make File
      if err = os.MkdirAll(filepath.Dir(fpath), os.ModePerm); err != nil {
        return filenames, err
      }

      outFile, err := os.OpenFile(fpath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
      if err != nil {
        return filenames, err
      }

      _, err = io.Copy(outFile, rc)

      // Close the file without defer to close before next iteration of loop
      outFile.Close()

      if err != nil {
        return filenames, err
      }

    }
  }
  return filenames, nil
}
