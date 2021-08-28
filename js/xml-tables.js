$(document).ready(function () {
  removeSVG();

  $("#vizpage").click(function () {
    lineage(5);
  });
  $("#vizpage3d").click(function () {
    graph3D();
  });

  $("#homepage").click(function () {
    removeSVG();
  });

  $("#search-input").on("keyup", function () {
    enableSearch($(this), "xml-table");
  });

  $("#btn-export-csv").click(function () {
    exportHTMLTableToCSV();
  });

  $("#btn-export-json").click(function () {
    tableToJson("xml-table");
  });

  iterateThroughClass(".node-type-badge");
});

function lineage(r) {
  // Clean up and re-load

  removeSVG();
  addSVG("#viz");

  // Initialize variables
  var data = createHierarchy();
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
        .id((d) => d.id)
        .distance(15)
        .strength(0.5)
    )
    .force("collide", d3.forceCollide(radius * 2))
    .force("charge", d3.forceManyBody().strength(-25))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-opacity", 0.1)
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
        objectuid: d.id,
        nodename: d.nodename,
        nodevalue: d.nodevalue,
        nodetype: d.nodetype,
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
        '<li class="list-group-item"> ObjectUID : ' +
        title.objectuid +
        "</li>" +
        '<li class="list-group-item">  Node Name: ' +
        title.nodename +
        "</li>" +
        '<li class="list-group-item"> Node Value : ' +
        title.nodevalue +
        "</li>" +
        '<li class="list-group-item"> Node Value : ' +
        title.nodetype +
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

    d3.selectAll("circle").style("opacity", 0.2);
    d3.selectAll("path").style("opacity", 0.2);

    d3.selectAll("circle")
      .filter(function (node) {
        return nodeNeighbors.indexOf(node.index) > -1;
      })
      .style("opacity", 1)
      .transition()
      .duration(1)
      .attr("r", r * 2);

    d3.select(this)
      .style("opacity", 1)
      .transition()
      .duration(1)
      .attr("r", r * 2);
  }

  function handleMouseOut(d, i) {
    d3.selectAll("circle").style("opacity", 1);
    d3.selectAll("circle").transition().duration(1).attr("r", r);
    d3.selectAll("path").style("opacity", 1);
  }
}

function graph3D() {
  // Clean up and re-load - faster load

  removeSVG();
  addSVG("#viz3d");

  const gData = createHierarchy();

  const elem = document.getElementById("svgdiv");

  const Graph = ForceGraph3D()(elem)
    .graphData(gData)
    .nodeRelSize(3)
    .nodeAutoColorBy("nodetype")
    .nodeLabel((node) => `${node.nodename}: ${node.nodevalue}`)
    .nodeOpacity(1)
    .nodeResolution(10)
    .onNodeClick((node) => {
      // Aim at node from outside it
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      Graph.cameraPosition(
        {
          x: node.x * distRatio,
          y: node.y * distRatio,
          z: node.z * distRatio,
        }, // new position
        node,
        1000
      );
    })
    .linkDirectionalParticleColor(() => "#ffff")
    .linkDirectionalParticleWidth(0.5)
    .linkDirectionalArrowLength(1)
    .linkDirectionalArrowRelPos(1)
    .linkHoverPrecision(5)
    .linkCurvature("curvature")
    .linkCurveRotation("rotation");

  Graph.onLinkClick(Graph.emitParticle); // emit particles on link click
  Graph.onEngineStop(() => Graph.zoomToFit(400));
}

function createHierarchy() {
  var allnodes = [];
  var hierarchy = { links: [], nodes: [] };

  $("tbody tr").each((i, row) => {
    var linkRow = {};
    var nodeInfo = {};

    var source = $(row).attr("parent-uid") ? $(row).attr("parent-uid") : "root";
    var target = $(row).attr("object-uid");
    var nodename = $(row).attr("node-name");
    var nodevalue = $(row).attr("node-value");
    var nodetype = $(row).attr("node-type");

    linkRow["source"] = source;
    linkRow["target"] = target;
    linkRow["curvature"] = Math.random();
    linkRow["rotation"] = Math.random();

    hierarchy["links"].push(linkRow);

    nodeInfo["id"] = target;
    nodeInfo["nodename"] = nodename;
    nodeInfo["nodevalue"] = nodevalue;
    nodeInfo["nodetype"] = nodetype;

    hierarchy["nodes"].push(nodeInfo);
  });

  var rootNode = {};
  rootNode["id"] = "root";
  rootNode["nodename"] = "root";
  rootNode["nodevalue"] = "root";
  hierarchy["nodes"].push(rootNode);

  return hierarchy;
}

function removeSVG() {
  $("#svgdiv").remove();
}

function addSVG(divID) {
  var svgdiv = $('<div id="svgdiv" class="d-flex w-100 h-100 flex-row"></div>');
  $(divID).append(svgdiv);

  d3.select("#svgdiv")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("id", "xml-graph");

  var d3params = $('<div id="d3params"' + "</div>");
  $("#svgdiv").append(d3params);
}

function enableSearch(element, tableID = "xml-table") {
  console.log("enableSearch!!");
  var value = $(element).val().toLowerCase();

  $("#" + tableID + " tbody tr").filter(function () {
    $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
  });
}

function exportHTMLTableToCSV(tableID = "xml-table", separator = ",") {
  //Select table records
  var records = document.querySelectorAll("table#" + tableID + " tr");
  // Build CSV String
  var csv = [];
  // console.log(records);
  for (var i = 0; i < records.length; i++) {
    var record = [];
    var cols = records[i].querySelectorAll("td, th");
    for (var j = 0; j < cols.length; j++) {
      // Removing newlines and condensing multiple spaces to one
      var data = cols[j].innerText
        .replace(/(\r\n|\n|\r)/gm, "")
        .replace(/(\s\s)/gm, " ");
      // Escape double-quotes
      data = data.replace(/"/g, '""');
      // Double quoted escaped column value
      record.push('"' + data + '"');
    }
    csv.push(record.join(separator));
  }
  var csvBlob = csv.join("\n");
  var filename =
    document.baseURI
      .split(/(\\|\/)/g)
      .pop()
      .split(/(\.)/g)[0] + ".csv";
  downloadCSVFile(csvBlob, filename);
}

function downloadCSVFile(csvBlob, filename) {
  var downloadLink = document.createElement("a");
  downloadLink.style.display = "none";
  downloadLink.setAttribute("target", "_blank");
  downloadLink.setAttribute(
    "href",
    "data:text/csv;charset=utf-8," + encodeURIComponent(csvBlob)
  );
  downloadLink.setAttribute("download", filename);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Adding Export to JSON functionality
// Copied from https://j.hn/html-table-to-json/

function tableToJson(tableID) {
  var table = $("table#" + tableID)[0];

  var headers = [];
  var data = [];
  // first row needs to be headers
  for (var i = 0; i < table.rows[0].cells.length; i++) {
    headers[i] = table.rows[0].cells[i].innerText
      .toLowerCase()
      .replace(/ /gi, "");
  }
  // go through cells
  for (var i = 1; i < table.rows.length; i++) {
    var tableRow = table.rows[i];
    var rowData = {};
    for (var j = 0; j < tableRow.cells.length; j++) {
      rowData[headers[j]] = tableRow.cells[j].innerText;
    }
    data.push(rowData);
  }

  var jsonBlob = JSON.stringify(data);

  var filename =
    document.baseURI
      .split(/(\\|\/)/g)
      .pop()
      .split(/(\.)/g)[0] + ".json";

  downloadJSONFile(jsonBlob, filename);
}

function downloadJSONFile(jsonBlob, filename) {
  var downloadLink = document.createElement("a");
  downloadLink.style.display = "none";
  downloadLink.setAttribute("target", "_blank");
  downloadLink.setAttribute(
    "href",
    "data:text/json;charset=utf-8," + encodeURIComponent(jsonBlob)
  );
  downloadLink.setAttribute("download", filename);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

function iterateThroughClass(queryClass) {
  // Select All elements with input queryClass class
  var records = document.querySelectorAll(queryClass);

  // console.log(records);

  for (var i = 0; i < records.length; i++) {
    // Calling custom function for every node selected for input class
    // Note that the input is a node (not text)
    setNodeTypeBadge(records[i]);
  }
}

function setNodeTypeBadge(nodetype) {
  // console.log(nodetype);

  if (nodetype.innerText === "Root") {
    $(nodetype).addClass(" badge");
    $(nodetype).addClass(" bg-primary");
  } else if (nodetype.innerText === "Processing Instruction") {
    $(nodetype).addClass(" badge");
    $(nodetype).addClass(" bg-success");
  } else if (
    nodetype.innerText === "Element" ||
    nodetype.innerText === "Element:Composite"
  ) {
    $(nodetype).addClass(" badge");
    $(nodetype).addClass(" bg-warning");
  } else if (nodetype.innerText === "Text") {
    $(nodetype).addClass(" badge");
    $(nodetype).addClass(" bg-dark");
  } else if (nodetype.innerText === "Attribute") {
    $(nodetype).addClass(" badge");
    $(nodetype).addClass(" bg-info");
  } else if (nodetype.innerText === "Comment") {
    $(nodetype).addClass(" badge");
    $(nodetype).addClass(" bg-success");
  }
}
