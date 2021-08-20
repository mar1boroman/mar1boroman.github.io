$(document).ready(function () {
  $("#vizpage").click(function () {
    renderSVG();
  });

  $("#homepage").click(function () {
    d3.select("#svgdiv").select("svg").remove();
  });
});

function renderSVG() {
  // Cleaning up the old SVG element
  d3.select("#svgdiv").select("svg").remove();

  // Append a svg node to target div #svgdiv
  d3.select("#svgdiv")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "xml-graph");

  var height = $(window).height();
  var width = $(window).width();

  // Select the svg node created
  var svg = d3
    .select("#xml-graph")
    .attr("viewBox", [0, 0, width, height])
    .style("cursor", "crosshair");

  var data = createJSON("xml-table");

  //   var data = {
  //       nodes : [
  //           {. . . . . . . . . . . . . . . . . . .},
  //           {. . . . . . . . . . . . . . . . . . .},
  //           {. . . . . . . . . . . . . . . . . . .},
  //       ],
  //       links : [
  //           {. . . . . . . . . . . . . . . . . . .},
  //           {. . . . . . . . . . . . . . . . . . .},
  //       ]
  //   }

  const links = data.links.map((d) => Object.create(d));
  const nodes = data.nodes.map((d) => Object.create(d));

  //   nodes = [
  //           {. . . . . . . . . . . . . . . . . . .},
  //           {. . . . . . . . . . . . . . . . . . .},
  //           {. . . . . . . . . . . . . . . . . . .},
  //       ]
  //   links = [
  //           {. . . . . . . . . . . . . . . . . . .},
  //           {. . . . . . . . . . . . . . . . . . .},
  //       ]

  const radius = 5; // radius of the nodes

  function colorscheme() {
    const scale = d3.scaleOrdinal(d3.schemeTableau10);
    return (d) => scale(d.parentuid);
  }

  drag = (simulation) => {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  const simulation = d3
    .forceSimulation(nodes)
    .force(
      "link",
      d3
        .forceLink(links)
        .id((d) => d.objectuid)
        .distance(5)
        .strength(0.5)
    )
    .force("collide", d3.forceCollide(radius * 2))
    .force("charge", d3.forceManyBody().strength(-5))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.3)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => {
      return Math.sqrt(d.value);
    });

  const node = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.4)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", radius)
    .attr("fill", colorscheme())
    .call(drag(simulation));

  //tooltip
  svg
    .selectAll("circle")
    .append("title")
    .text((d) => {
      return d.nodename + "," + d.nodevalue;
    });

  //Redraw logic
  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  //Zoom & Pan functionality
  svg.call(
    d3
      .zoom()
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([1, 8])
      .on("zoom", zoomed)
  );
  function zoomed({ transform }) {
    node.attr("transform", transform);
    link.attr("transform", transform);
  }
}

function createJSON(tableID) {
  var table = $("table#" + tableID)[0];

  var headers = [];
  var data = { nodes: [], links: [] };
  // define column names in JSON based on headers in the table
  for (var i = 0; i < table.rows[0].cells.length; i++) {
    headers[i] = table.rows[0].cells[i].innerText
      .toLowerCase()
      .replace(/ /gi, "");
  }

  // go through cells

  for (var i = 1; i < table.rows.length; i++) {
    var tableRow = table.rows[i];
    var nodeData = {};
    var linkData = {};
    for (var j = 0; j < tableRow.cells.length; j++) {
      nodeData[headers[j]] = tableRow.cells[j].innerText;

      if (headers[j] === "parentuid") {
        linkData.source = tableRow.cells[j].innerText;
        if (tableRow.cells[j].innerText === "") {
          linkData.source = "root";
          nodeData[headers[j]] = "root";
        }
      }
      if (headers[j] === "objectuid") {
        linkData.target = tableRow.cells[j].innerText;
      }
    }
    data["nodes"].push(nodeData);

    if (linkData.source != "root") {
      data["links"].push(linkData);
    }
  }
  return data;
}
