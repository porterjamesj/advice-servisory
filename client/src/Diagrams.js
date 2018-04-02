import React, { Component } from "react";
import MareyDiagram from "./MareyDiagram.js";
import './Diagrams.css';

class Diagrams extends Component {
  render() {
    let lines = ["1", "2", "4", "5", "6", "7", "A", "C", "D", "F", "E","G", "J", "L", "M", "N", "Q", "R", "Z"];
    let graphs = []

    for (let i = 0; i < lines.length; i++) {
      graphs.push(<div className="line-block">
        <div className="label">{lines[i] + " Train"}</div> 
        <MareyDiagram width={500} height={400} route={lines[i]} /></div>);
    }

    return <div className="graphs">
    {graphs}    
    </div>
  }
}

export default Diagrams;