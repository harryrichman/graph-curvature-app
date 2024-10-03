// var graphURL = "graph.gwstagg.co.uk/live"
// var graphURL = "http://0.0.0.0:8090";
var undoStack = new Array();
var curveTypeStack = new Array();
$(document).ready(function() {
  spinner.stop();
  var addNewNode = 0;
  var nodeid = 1;
  var hoveringOnNode = 0;
  var hoveringNode = "";
  var tappingOnNode = 0;
  var tappingNode = "";
  var touchdragged = 0;
  var sourceNode = "";
  var curveType = 1;
  var showLabels = 1;
  var AM = [];
  var V = [];
  var AMstring = "";
  var Vstring = "";
  var cy = window.cy = cytoscape({
    container: document.getElementById('cy'),
    boxSelectionEnabled: false,
    autounselectify: true,

    layout: {
      name: 'grid'
    },
    style: [{
        selector: 'node',
        style: {
          'height': 14,
          'width': 14,
          'background-color': 'data(pol)',
          'font-size': '2em',
          'label': 'data(curve)'
        }
      },
      {
        selector: 'edge',
        style: {
          'curve-style': 'haystack',
          'haystack-radius': 0,
          'width': 4,
          'opacity': 0.95,
          'font-size': '2em',
          'line-color': 'data(pol)',
          'label': 'data(ecurve)'
        }
      }
    ],
    elements: [{
      "data": {
        "id": "n40",
        "weight": 1,
        "curve": "0",
        "pol": "#000000"
      },
      "position": {
        "x": 0,
        "y": 0
      },
      "group": "nodes",
      "removed": false,
      "selected": false,
      "selectable": true,
      "locked": false,
      "grabbable": true,
      "classes": ""
    }],
    minZoom: 0.5,
    maxZoom: 3
  });

  var pos = cy.nodes("#n40").position();
  cy.zoom({
    level: 1,
    position: pos
  });

  //setup styles
  cy.style().selector('core').style({
    'active-bg-opacity': '0'
  }).update();
  cy.style().selector('node').style({
    'overlay-opacity': '0'
  }).update();
  $("#admjsoncontainer").hide();
  $("#controlsinfo").hide();
  pushStateToStack();

  function buildAM() {
    // adjacency matrix
    V = [];
    AM = [];
    nodes = cy.nodes("[weight>0]");
    numV = nodes.length;
    for (i = 0; i < numV; i++) {
      V[i] = nodes[i].data().id;
    }
    Vstring = JSON.stringify(V);
    for (var i = 0; i < numV; i++) {
      AM[i] = new Array(numV);
      for (var j = 0; j < numV; j++) {
        AM[i][j] = 0;
      }
    }
    edges = cy.edges("[weight>0]");
    numE = edges.length;
    for (i = 0; i < numE; i++) {
      source = edges[i].data().source;
      target = edges[i].data().target;
      vs = V.indexOf(source);
      vt = V.indexOf(target);
      AM[vs][vt] = 1;
      AM[vt][vs] = 1;
    }
    AMstring = JSON.stringify(AM);
    $('#admjson').text(AMstring);
  }

  function updateLabels(json) {
    nodes = cy.nodes("[weight>0]");
    numV = nodes.length;
    edges = cy.edges("[weight>0]");
    numE = edges.length;
    // debugging
    console.log("nodes: ");
    console.log(nodes);
    console.log("edges: ");
    console.log(edges);
    //clean up
    for (i = 0; i < numV; i++) {
      nodes[i].data('curve', "");
      nodes[i].data('pol', '#000000');
    }
    for (i = 0; i < numE; i++) {
      edges[i].data('ecurve', "");
      edges[i].data('pol', '#aaaaaa');
    }
    if (curveType == 1) { // link resistance curvature
      for (i = 0; i < numV; i++) {
        for (j = 0; j < numV; j++) {
          if (i == j) continue;
          if (typeof json["AM"][i] === "undefined") continue;
          if (json["AM"][i][j] == 0) continue;
          //only connected i,j left
          console.log("searching for edges from " + i + " to " + j);
          selected_edges = cy.edges(
            `[source="${nodes[i].data().id}"][target="${nodes[j].data().id}"]`
          )
          if (selected_edges.length == 1) {
            console.log("single edge found with given endpoints");
            LRC = Math.round(json["LRC"][i][j] * 1000) / 1000
            selected_edges[0].data('ecurve', LRC);
            if (LRC < 0) {
              selected_edges[0].data('pol', "#ef8888");
            } else if (LRC > 0) {
              selected_edges[0].data('pol', "#8888ef");
            } else {
              selected_edges[0].data('pol', "#aaaaaa");
            }
          } else if (selected_edges.length > 1) {
            console.log("error: more than one edge found!");
            console.log(selected_edges.length)
          }
        }
      }
    } else if (curveType == 3) { // foster coefficient
      for (i = 0; i < numV; i++) {
        for (j = 0; j < numV; j++) {
          if (i == j) continue;
          if (typeof json["AM"][i] === "undefined") continue;
          if (json["AM"][i][j] == 0) continue;
          //only connected i,j left
          selected_edges = cy.edges(
            `[source="${nodes[i].data().id}"][target="${nodes[j].data().id}"]`
          )
          if (selected_edges.length == 1) {
            FC = Math.round(json["FC"][i][j] * 1000) / 1000
            selected_edges[0].data('ecurve', FC);
            if (FC < 0) {
              selected_edges[0].data('pol', "#ef8888");
            } else if (FC > 0) {
              selected_edges[0].data('pol', "#8888ef");
            } else {
              selected_edges[0].data('pol', "#aaaaaa");
            }
          } else {
            console.log("error: more than one edge found!");
          }
        }
      };
    } else { // node-based curvature
      for (i = 0; i < numV; i++) {
        id = nodes[i].data().id;
        vs = V.indexOf(id);
        // console.log("vertex id vs: " + vs); // debugging
        if (curveType == 0) { // vertex labels
          nodes[i].data('curve', 'v' + vs);
          nodes[i].data('pol', '#000000');
        } else if (curveType == 2) { // vertex resistance curvature
          nodes[i].data('curve', json[vs]);
          if (json[vs] < 0) {
            nodes[i].data('pol', '#e01818');
          } else if (json[vs] > 0) {
            nodes[i].data('pol', '#1818e0');
          } else {
            nodes[i].data('pol', '#000000');
          }
        } else {
          console.log("error: invalid curveType")
        }
      }
    }
    if (showLabels == 0) {
      for (i = 0; i < numV; i++) {
        nodes[i].data('curve', "");
      }
      for (i = 0; i < numE; i++) {
        edges[i].data('ecurve', "");
      }
    }
  }

  function getVertexLabels() {
    curveType = $("#curveType").val();
    if (curveType != 0) {
      console.log("Error occurred; vertex labels generated with other type set")
    }
    if (cy.nodes("[weight>0]").length == 1) {
      cy.nodes("[weight>0]")[0].data('pol', "#000000");
      if (showLabels == 0) {
        cy.nodes("[weight>0]")[0].data('curve', "");
        return;
      }
      if (curveType == 0) { // vertex labels
        cy.nodes("[weight>0]")[0].data('curve', "v0");
        return;
      } else {
        cy.nodes("[weight>0]")[0].data('curve', "0");
        return;
      }
    }
  }

  function getlabels() {
    curveType = $("input[type='radio'][name='curvType']:checked").val();
    // curveType = $("#curveType").val();
    if (cy.nodes("[weight>0]").length == 1) {
      cy.nodes("[weight>0]")[0].data('pol', "#000000");
      if (showLabels == 0) {
        cy.nodes("[weight>0]")[0].data('curve', "");
        return;
      }
      if (curveType == 0) { // vertex label
        cy.nodes("[weight>0]")[0].data('curve', "v0");
        return;
      } else {
        cy.nodes("[weight>0]")[0].data('curve', "0");
        return;
      }
    }
    if (curveType == 0) {
      // fill in
      for (i = 0; i < cy.nodes("[weight>0]").length; i++) {
        cy.nodes("[weight>0]")[i].data('curve', "v" + i);
      }
    }
    else {
      buildAM();
      if (typeof(spinner) != "undefined") {
        spinner.stop();
      }
      var spinner = new Spinner(opts).spin();
      $(".spinner").remove();
      document.getElementById('cy').appendChild(spinner.el);

      $.ajax({
        method: "POST",
        url: "get-labels",
        // url: "{{ url_for('get-labels') }}",
        data: {
          am: AMstring,
          v: Vstring,
          t: curveType,
          d: "2",
          idlen: "0"
        },
        dataType: 'json',
        success: function(json) {
          var patt = new RegExp("error");
          var err = patt.test(json[0]);
          if (!err) {
            updateLabels(json);
            console.log("json:");
            console.log(json);
            spinner.stop();
          } else {
            if (json[0] == "error8") {
              nodes = cy.nodes("[weight>0]");
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('curve', '-∞');
              }
            }
            if (json[0] == "error8b") {
              nodes = cy.nodes("[weight>0]");
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('curve', 'NaN');
              }
            }
            if (json[0] == "error13a") {
              nodes = cy.edges();
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('ecurve', 'NaN');
                nodes[i].data('pol', '#aaaaaaa');
              }
              nodes = cy.nodes("[weight>0]");
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('pol', '#000000');
              }
            }
            if (json[0] == "error13b") {
              nodes = cy.edges();
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('ecurve', '0');
                nodes[i].data('pol', '#aaaaaa');
              }
              nodes = cy.nodes("[weight>0]");
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('pol', '#000000');
              }
            }
            if (json[0] == "error13c") {
              nodes = cy.edges();
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('ecurve', 'NaN');
                nodes[i].data('pol', '#aaaaaa');
              }
              nodes = cy.nodes("[weight>0]");
              for (i = 0; i < nodes.length; i++) {
                nodes[i].data('pol', '#000000');
              }
            }

            spinner.stop();
          }
        },
        error: function(json) {
          console.log("ERROR: " + JSON.stringify(json));
          spinner.stop();
        }
      });
    }

  }

  function popStateFromStack() {
    laststate = undoStack[undoStack.length - 2];
    lastCurveType = curveTypeStack[curveTypeStack.length - 2];
    if (typeof laststate === "undefined") {
      console.log("Can't load state!");
    } else {
      undoStack.pop()
      curveTypeStack.pop();
      cy.json(JSON.parse(LZString.decompressFromBase64(laststate)));
      curveType = lastCurveType;
      $("#curveType").val(curveType);
      getlabels();
    }
  }

  function pushStateToStack() {
    save = LZString.compressToBase64(JSON.stringify(cy.json()));
    undoStack.push(save);
    curveTypeStack.push(curveType);
  }

  function connectNodes(n1, n2) {
    console.log("Try to connect nodes " + n1 + " and " + n2);
    if (n1 != n2) { //if not the same
      var e = cy.$("node#" + n1);
      var j = cy.$("node#" + n2);
      if (e.edgesWith(j).length == 0) { // if edge doesn't exist yet
        console.log("Connecting...");
        cy.add([{
          group: "edges",
          data: {
            id: nodeid.toString(),
            "weight": 1,
            "ecurve": "",
            "pol": "#aaaaaa",
            source: n1,
            target: n2
          }
        }]);
        nodeid = nodeid + 1;
        getlabels();
        pushStateToStack();
      } else {
        console.log("No change, edge already exists")
      }
    } else {
      console.log("No change, same node selected")
    }
  }

  function addNodeAt(xloc, yloc) {
    console.log("Adding node with ID:" + nodeid.toString() + " at " + xloc +
      ", " + yloc);
    cy.add([{
      group: "nodes",
      data: {
        id: nodeid.toString(),
        "weight": 1,
        "curve": "",
        "pol": "#000000"
      },
      renderedPosition: {
        x: xloc,
        y: yloc
      }
    }]);
    nodeid = nodeid + 1;
    return nodeid - 1;
  }

  function removeNode(n1) {
    if (cy.nodes("[weight>0]").length == 1) return; //dont remove last one!
    cy.remove(cy.$("node#" + n1));
    //remove orphans
    numV = cy.nodes("[weight>0]").length;
    for (i = 0; i < numV; i++) {
      if (cy.nodes("[weight>0]")[i].connectedEdges().length == 0) {
        removeNode(cy.nodes("[weight>0]")[i].data().id);
      }
    }
    getlabels();
    pushStateToStack();
  }

  function removeEdge(e1) {
    cy.remove(cy.$("edge#" + e1));
    //remove orphans
    numV = cy.nodes("[weight>0]").length;
    for (i = 0; i < numV; i++) {
      if (cy.nodes("[weight>0]")[i].connectedEdges().length == 0) {
        removeNode(cy.nodes("[weight>0]")[i].data().id);
      }
    }
    getlabels();
    pushStateToStack();
  }

  function autoLayout() {
    cy.layout({
      name: $('#autolayoutselect').val(),
      fit: true,
      padding: 300,
      animate: true,
      nodeDimensionsIncludeLabels: true
    });
  }

  function loadAM(newAMString) {
    try {
      newAM = JSON.parse(newAMString);
    } catch (e) {
      return -2;
    }
    //test for symmetry and zero diagonal
    numV = newAM.length;

    zerodiag = 1;
    for (i = 0; i < numV; i++) {
      if (newAM[i][i] != 0) zerodiag = 0;
    }
    if (zerodiag == 0) return -3;

    symmetric = 1;
    for (i = 0; i < numV; i++) {
      for (j = 0; j < numV; j++) {
        if (i == j) continue;
        if (newAM[i][j] != newAM[j][i]) symmetric = 0;
      }
    }
    if (symmetric == 0) return -3;

    pushStateToStack();
    //remove all
    nodes = cy.nodes("[weight>0]");
    numV = nodes.length;
    for (i = 0; i < numV; i++) cy.remove(nodes[i]);
    edges = cy.edges("[weight>0]");
    numE = edges.length;
    for (i = 0; i < numE; i++) cy.remove(edges[i]);

    //build
    nodeid = 0;
    numV = newAM.length;
    if (numV == 0) return -1;
    for (i = 0; i < numV; i++) {
      cy.add([{
        group: "nodes",
        data: {
          id: i.toString(),
          "weight": 1,
          "curve": "",
          "pol": "#000000"
        },
        renderedPosition: {
          x: 0,
          y: 0
        }
      }]);
    }
    nodeid = numV + 1;
    for (i = 0; i < numV; i++) {
      for (j = i; j < numV; j++) {
        if (i == j) continue;
        if (newAM[i][j] != 0) {
          cy.add([{
            group: "edges",
            data: {
              id: nodeid.toString(),
              weight: 1,
              source: i.toString(),
              target: j.toString(),
              "pol": "#aaaaaa"
            }
          }]);
          nodeid = nodeid + 1;
        }
      }
    }
    return 0;
  }

  cy.on('mouseover', 'node', function(event) {
    var node = event.cyTarget;
    hoveringOnNode = 1;
    hoveringNode = node.data().id;
  });
  cy.on('mouseout', 'node', function(event) {
    var node = event.cyTarget;
    hoveringOnNode = 0;
    hoveringNode = "";
  });

  cy.on('cxttapstart', 'edge', function(event) {
    var edge = event.cyTarget.data().id;
    console.log("removing edge ID:" + edge);
    removeEdge(edge);
  });
  cy.on('touchstart', 'node', function(event) {
    var node = event.cyTarget;
    tappingNode = node.data().id;
    tappingOnNode = 1;
  });

  cy.on('touchmove', function(event) {
    touchdragged = 1;
    tappingOnNode = 0;
    tappingNode = "";
  });

  cy.on('touchend', function(event) {
    if (tappingOnNode == 0 && touchdragged == 0 && addNewNode == 1) {
      offset = $("cy").offset(),
        x = event.originalEvent.changedTouches[0].pageX;
      y = event.originalEvent.changedTouches[0].pageY;
      newNodeID = addNodeAt(x, y);
      tappingOnNode = 0;
      tappingNode = "";
      connectNodes(sourceNode, newNodeID);
      addNewNode = 0;
    } else if (tappingOnNode == 1 && addNewNode == 0 && touchdragged ==
      0) {
      addNewNode = 1;
      sourceNode = tappingNode;
      cy.$("node#" + sourceNode).data('pol', '#FF8C00');
      tappingNode = "";
      tappingOnNode = 0;
    } else if (tappingOnNode == 1 && addNewNode == 1 && touchdragged ==
      0) {
      connectNodes(sourceNode, tappingNode);
      tappingOnNode = 0;
      tappingNode = "";
      addNewNode = 0;
    }

    touchdragged = 0;
  });

  cy.on('taphold', 'node', function(event) {
    touchdragged = 1;
    tappingOnNode = 0;
    tappingNode = "";
    var node = event.cyTarget;
    console.log("removing node ID:" + node.data().id);
    removeNode(node.data().id);
  });

  cy.on('taphold', 'edge', function(event) {
    touchdragged = 1;
    tappingOnNode = 0;
    tappingNode = "";
    var edge = event.cyTarget.data().id;
    console.log("removing edge ID:" + edge);
    removeEdge(edge);
  });

  $("#admhideshow").click(function(event) {
    if ($("#admjsoncontainer").is(":visible")) {
      $("#admjsoncontainer").hide();
      $("#admhideshow").text("[Show]");
    } else {
      $("#admjsoncontainer").show();
      $("#admhideshow").text("[Hide]");
    }
  });

  $("#showhideinfo").click(function(event) {
    if ($("#controlsinfo").is(":visible")) {
      $("#controlsinfo").hide();
      $("#showhideinfo").text("[Show Help]");
    } else {
      $("#controlsinfo").show();
      $("#showhideinfo").text("[Hide]");
    }
  });

  $("#autolayoutselect").change(function(event) {
    autoLayout();
    pushStateToStack();
  });

  $("#labelsbtn").click(function(event) {
    if (showLabels == 1) {
      showLabels = 0;
    } else {
      showLabels = 1;
    }
    getlabels();
  });


  $("#savebtn").click(function(event) {
    swal({
      title: "<small>Copy this graph data somewhere safe!</small>",
      text: "<p style='font-size:10px;word-break: break-all'>" +
        undoStack[undoStack.length - 1] + "</p>",
      html: true
    });
  });
  $("#loadbtn").click(function(event) {
    swal({
        title: "Load Graph",
        text: "Input adjacency matrix:",
        type: "input",
        showCancelButton: true,
        closeOnConfirm: false,
        inputPlaceholder: "Adjacency Matrix"
      },
      function(inputValue) {
        if (inputValue === false) return false;
        if (inputValue === "") {
          swal.showInputError("Graph load error");
          return false
        }
        status = loadAM(inputValue);
        if (status < 0) {
          swal.showInputError("Graph load error");
          return false;
        } else {
          setTimeout(function() {
            autoLayout();
            getlabels();
            swal.close();
          }, 0);
        }
        return true;
      });
  });


  $("#undobtn").on('click', function(event) {
    popStateFromStack();
  });

/*  $("#curveType").change(function() {
    getlabels();
    pushStateToStack();
  }); */
  $("#radioCurveType").change(function() {
    getlabels();
    pushStateToStack();
    console.log("radio button change");
  });
  $("#dimN").change(function() {
    getlabels();
    pushStateToStack();
  });
  $("#idleN").change(function() {
    getlabels();
    pushStateToStack();
  });

  $(document).on('click', "body", function(event) {
    switch (event.which) {
      case 1:
        if (addNewNode == 0 && hoveringOnNode == 1) {
          console.log("starting add new node mode...")
          //cy.$("node#"+hoveringNode).style({'background-color':'#18e018'});
          cy.$("node#" + hoveringNode).data('pol', '#FF8C00');
          $('#addcircle').css({
            left: event.pageX - 12 + 'px',
            top: event.pageY - 12 + 'px'
          });
          sourceNode = hoveringNode;
          addNewNode = 1;
          $('#addcircle').show();
        } else if (addNewNode == 1 && hoveringOnNode == 1) {
          connectNodes(sourceNode, hoveringNode);
          addNewNode = 0;
          //cy.$("node#"+sourceNode).style({'background-color':'data(pol)'});
          cy.$("node#" + hoveringNode).data('pol', '#000000');
          $('#addcircle').hide();
        } else if (addNewNode == 1 && hoveringOnNode == 0) {
          newNodeID = addNodeAt(event.pageX, event.pageY);
          hoveringOnNode = 1;
          hoveringNode = newNodeID;
          connectNodes(sourceNode, hoveringNode);
          //cy.$("node#"+sourceNode).style({'background-color':'data(pol)'});
          addNewNode = 0;
          $('#addcircle').hide();
        }
        break;
      case 3:
        break;
      default:
        console.log('You have a strange Mouse!');
    }
  });

  $(document).on("contextmenu", "body", function(e) {
    if (addNewNode == 0 && hoveringOnNode == 1) {
      console.log("removing node ID:" + hoveringNode);
      removeNode(hoveringNode);
    }
    return false;
  });

  $("#cy").mousemove(function(event) {
    if (addNewNode == 1) {
      $('#addcircle').css({
        left: event.pageX - 12 + 'px',
        top: event.pageY - 12 + 'px'
      });
    }
  });

});
