import React, { Component } from "react";
import moment from "moment";

class Tooltip extends Component {
  render() {
    return (
      <g className="tooltip">
        <path
          d={
            "M" +
            this.props.coords.x +
            " " +
            this.props.coords.y +
            " " +
            "L" +
            this.props.coords.x +
            " " +
            (this.props.coords.y - this.props.coords.h)
          }
        />
        <path
          d={
            "M" +
            this.props.coords.x +
            " " +
            this.props.coords.y +
            " " +
            "L" +
            (this.props.coords.x + this.props.coords.w) +
            " " +
            (this.props.coords.y - this.props.coords.h)
          }
        />
        <text
          x={this.props.coords.x + 5}
          y={this.props.coords.y + 8}
          transform={
            "rotate(" +
            -Math.atan(this.props.coords.h / this.props.coords.w) *
              (180 / Math.PI) +
            "," +
            (this.props.coords.x + 5) +
            "," +
            (this.props.coords.y + 8) +
            ")"
          }
        >
          40 km/hr
        </text>

        <text
          x={this.props.coords.x - 10}
          y={this.props.coords.y - 35}
          transform={
            "rotate(90," +
            (this.props.coords.x - 10) +
            "," +
            (this.props.coords.y - 35) +
            ")"
          }
        >
          10 mins
        </text>
      </g>
    );
  }
}

class MareyDiagram extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      margins: [75, 20, 100, 140],
      tooltip: {}
    };
  }

  componentDidMount() {
    this.update();
    window.setInterval(this.update.bind(this), 30000);
  }

  update() {
    fetch("http://serviceadvisory.nyc/api/route/" + this.props.route)
      .then(response => response.json())
      .then(json => {
        if (json.length > 0) {
          let minTime = moment(json[0].timestamp).unix();
          let maxTime = moment(json[0].timestamp).unix();
          let minProg = json[0].progress;
          let maxProg = json[0].progress;

          for (let i = 0; i < json.length; i++) {
            if (moment(json[i].timestamp).unix() < minTime) {
              minTime = moment(json[i].timestamp).unix();
            }
            if (moment(json[i].timestamp).unix() > maxTime) {
              maxTime = moment(json[i].timestamp).unix();
            }
            if (json[i].progress < minProg) {
              minProg = json[i].progress;
            }
            if (json[i].progress > maxProg) {
              maxProg = json[i].progress;
            }
          }

          this.setState({
            data: json,
            maxTime: maxTime,
            minTime: minTime,
            minProg: minProg,
            maxProg: maxProg
          });
        }
      });
  }

  pointToString = (p, t) => {
    return this.progToScreen(p) + " " + this.timeToScreen(t) + " ";
  };

  progToScreen = p => {
    return (
      (p - this.state.minProg) /
        (this.state.maxProg - this.state.minProg) *
        (this.props.width - this.state.margins[0] - this.state.margins[2]) +
      this.state.margins[0]
    );
  };

  timeToScreen = t => {
    return (
      (t - this.state.minTime) /
        (this.state.maxTime - this.state.minTime) *
        (this.props.height - this.state.margins[1] - this.state.margins[3]) +
      this.state.margins[1]
    );
  };

  makeXLegend = () => {
    let done = [-1];
    let legend = [];

    for (let i = 0; i < this.state.data.length; i++) {
      let dists = done.map(d => {
        return Math.abs(d - this.state.data[i].progress);
      });
      let minval = Math.min(...dists);
      if (minval > 1.0) {
        legend.push(
          <g>
            <path
              className="prog-tick"
              d={
                "M" +
                this.pointToString(
                  this.state.data[i].progress,
                  this.state.minTime
                ) +
                "L" +
                this.pointToString(
                  this.state.data[i].progress,
                  this.state.maxTime
                )
              }
            />
            <text
              className="prog-label"
              transform={
                "rotate(45," +
                (this.progToScreen(this.state.data[i].progress) - 5) +
                "," +
                (this.props.height - this.state.margins[3] + 10) +
                ")"
              }
              x={this.progToScreen(this.state.data[i].progress) - 5 + "px"}
              y={this.props.height - this.state.margins[3] + 10 + "px"}
            >
              {this.state.data[i].stop.name}
            </text>
          </g>
        );

        done.push(this.state.data[i].progress);
      }
    }

    return legend;
  };

  makeYLegend = () => {
    let t = moment.unix(this.state.minTime);
    let legend = [];

    t.add(1, "hour");
    t.minute(0);

    while (t < moment.unix(this.state.maxTime)) {
      legend.push(
        <g className="time">
          <text
            className="time-label"
            x="5px"
            y={this.timeToScreen(t.unix()) + 6 + "px"}
          >
            {t.format("ddd, hA")}
          </text>
          <path
            className="time-tick"
            d={
              "M" +
              this.pointToString(this.state.minProg, t.unix()) +
              "L" +
              this.pointToString(this.state.maxProg, t.unix())
            }
          />
        </g>
      );
      t.add(1, "hour");
    }

    return legend;
  };

  tooltip = e => {
    e.preventDefault();

    let rect = e.target.getBoundingClientRect();
    let y = e.clientY - rect.y;
    let x = e.clientX - rect.x;

    if (rect.height === this.props.height) {
      let h =
        moment.duration(10, "minutes") /
        (moment.unix(this.state.maxTime) - moment.unix(this.state.minTime));
      h *= rect.height;

      let w = 4 / (this.state.maxProg - this.state.minProg);
      w *= rect.width;

      this.setState({ tooltip: { x, y, h, w } });
    }
  };

  clearTooltip = e => {
    e.preventDefault();
    this.setState({ tooltip: {} });
  };

  render() {
    let paths = {};
    let dompaths = [];

    let x_legend = this.makeXLegend();
    let y_legend = this.makeYLegend();

    for (let i = 0; i < this.state.data.length; i++) {
      if (
        this.props.direction === -1 ||
        this.props.direction === this.state.data[i].trip.direction
      ) {
        if (!(this.state.data[i].trip.id in paths)) {
          paths[this.state.data[i].trip.id] =
            "M" +
            this.pointToString(
              this.state.data[i].progress,
              moment(this.state.data[i].timestamp).unix()
            );
        }

        paths[this.state.data[i].trip.id] +=
          "L" +
          this.pointToString(
            this.state.data[i].progress,
            moment(this.state.data[i].timestamp).unix()
          );
      }
    }

    dompaths = Object.values(paths).map(p => {
      return <path d={p} />;
    });

    if (this.state.data.length > 0) {
      return (
        <svg
          width={this.props.width}
          height={this.props.height}
          onMouseMove={this.tooltip}
          onMouseLeave={this.clearTooltip}
        >
          <g className={"train " + this.state.data[0].trip.route}>
            {x_legend}
            {y_legend}
            {dompaths}
            {this.state.tooltip ? (
              <Tooltip coords={this.state.tooltip} />
            ) : (
              <g />
            )}
          </g>
        </svg>
      );
    } else {
      return <div />;
    }
  }
}

export default MareyDiagram;
