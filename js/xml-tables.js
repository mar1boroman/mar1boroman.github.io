$(document).ready(function () {
  $("#search-input").on("keyup", function () {
    enableSearch($(this), "xml-table");
  });

  $("#btn-export-csv").click(function () {
    exportHTMLTableToCSV();
  });

  iterateThroughClass(".node-type-badge");
});

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
  console.log(records);
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
