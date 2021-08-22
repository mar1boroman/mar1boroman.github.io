$(document).ready(function () {
  removeSVG();

  $("#vizpage").click(function () {
    renderSVG(2);
  });

  $("#homepage").click(function () {
    removeSVG();
  });
});

function removeSVG() {
  $("#svgdiv").remove();
}

function addSVG() {
  var svgdiv = $('<div id="svgdiv" class="d-flex w-100 h-100 flex-row"></div>');
  $("#viz").append(svgdiv);

  d3.select("#svgdiv")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "xml-graph");

  var d3params = $.parseHTML('<div id="d3params"' + "</div>");
  $("#svgdiv").append(d3params);
}

function renderSVG(r) {
  // Clean up and re-load

  removeSVG();
  addSVG();

  // Initialize variables
  var data = createJSON("xml-table");
  var radius = r; // radius of the nodes
  var height = window.innerHeight ? window.innerHeight : $(window).height();
  var width = $(window).width();

  var svg = d3
    .select("#xml-graph")
    .attr("viewBox", [0, 0, width, height])
    .style("cursor", "crosshair")
    .call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([1, 8])
        .on("zoom", zoomed)
    );

  const links = data.links.map((d) => Object.create(d));
  const nodes = data.nodes.map((d) => Object.create(d));

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
    .attr("stroke-width", 1);

  const node = svg
    .append("g")
    .attr("stroke", "#fff")
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", radius)
    .attr("fill", colorscheme())
    .on("mouseover", handleMouseOver)
    .on("mouseout", handleMouseOut)
    .call(drag(simulation));

  //Adding interactivity to all circle nodes
  svg
    .selectAll("circle")
    .on("click", handleClick)
    .attr("stroke-width", 0.4)
    .append("title")
    .text((d) => {
      return JSON.stringify({
        parentuid: d.parentuid,
        objectuid: d.objectuid,
        nodetype: d.nodetype,
        nodename: d.nodename,
        nodevalue: d.nodevalue,
        nodepath: d.nodepath,
      });
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

  //Internal Functions used by the above code

  function drag(simulation) {
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
  }

  function colorscheme() {
    const scale = d3.scaleOrdinal(d3.schemeTableau10);
    return (d) => scale(d.nodetype);
  }

  function zoomed({ transform }) {
    node.attr("transform", transform);
    link.attr("transform", transform);
  }

  function handleClick(d, i) {
    var title = JSON.parse(d.target.children[0].textContent);

    $("#d3params").html(
      '<div id="infocard" class="card" style="width: 18rem;">' +
        '<div class="card-header">Selection Details</div>' +
        '<ul class="list-group list-group-flush">' +
        '<li class="list-group-item"> ParentUID : ' +
        title.parentuid +
        "</li>" +
        '<li class="list-group-item"> ParentUID : ' +
        title.objectuid +
        "</li>" +
        '<li class="list-group-item"> ParentUID : ' +
        title.nodetype +
        "</li>" +
        '<li class="list-group-item"> ParentUID : ' +
        title.nodename +
        "</li>" +
        '<li class="list-group-item"> ParentUID : ' +
        title.nodevalue +
        "</li>" +
        "</ul>" +
        "</div>"
    );
  }

  function handleMouseOver(d, i) {
    var nodeNeighbors = links
      .filter((link) => {
        return (
          link.source.index === d.target.__data__.index ||
          link.target.index === d.target.__data__.index
        );
      })
      .map(function (link) {
        return link.source.index === d.target.__data__.index
          ? link.target.index
          : link.source.index;
      });

    svg.selectAll("circle").style("opacity", 0.2);

    svg
      .selectAll("circle")
      .filter(function (node) {
        return nodeNeighbors.indexOf(node.index) > -1;
      })
      .style("opacity", 1)
      .transition()
      .duration(1)
      .attr("r", 5);

    d3.select(this).style("opacity", 1).transition().duration(1).attr("r", 5);
  }

  function handleMouseOut(d, i) {
    svg.selectAll("circle").style("opacity", 1);
    d3.selectAll("circle").transition().duration(1).attr("r", 2);
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
