$(document).ready(function(){

/* keep header float when we scrolling down */
window.addEventListener("scroll", function(e) {
  var scr = $(window).scrollTop();
  var top = $("#content").offset().top;
  if(scr >= top && $("#head").css("position") != "fixed") {
    $("#head").css({position: "fixed", top: 0});
  } else if(scr < top && $("#head").css("position") != "absolute") {
    $("#head").css({position: "absolute", top: "auto"});
  }
});

var president = [
  ["連戰","kmt","10"],["陳水扁","dpp","10"],
  ["連戰","kmt","11"],["陳水扁","dpp","11"],
  ["馬英九","kmt","12"],["謝長廷","dpp","12"],
  ["馬英九","kmt","13"],["蔡英文","dpp","13"],
  ["朱立倫","kmt","14"],["蔡英文","dpp","14"]
]

var colors = {
  kmt: {
    zonton: "#2d55e8",
    hint: "#2d55e8",
    rectStroke: "#2d55e8",
    rectFill: "#2d55e8",
    gradient: "#2d55e8",
    hoverPathFill: "#2d55e8",
    hoverRectFill: "#2d55e8"
  },
  dpp: {
    zonton: "#21b733",
    hint: "#21b733",
    rectStroke: "#21b733",
    rectFill: "#21b733",
    gradient: "#21b733",
    hoverPathFill: "#21b733",
    hoverRectFill: "#21b733"
  }
};

var prompt = d3.select("#prompt");
var width = 800;
var height = 800;
var xmargin = 60;
var ymargin = 60;
var block = { width: 10, height: 20};

d3.csv("vote.csv", function(rawRate) {
d3.json("notes.json", function(rawNote) {

var points = []; /* for rectangle blocks */
var lines = []; /* for curve line paths */
var mouse = { county: null }; /* last hovered county info */

/* Construct data for visualization */
rawRate.map(function(item) {
  county = item["地區"];
  for(key in item) {
    if(key == "地區") continue;
    session = parseInt(key);
    rate = parseFloat(item[key]);
    points.push({county: county, session: session, rate: rate});
  }
  var ks = d3.entries(item)
    .map(function(it) { return [parseInt(it.key), parseFloat(it.value)]})
    .filter(function(it) { return !isNaN(it[0]); });
  ks.sort(function(a,b) { return a[0] - b[0]; });
  for(var idx = 0; idx < ks.length - 1; idx ++) {
    lines.push({
      county: county,
      session1: ks[idx][0], session2: ks[idx + 1][0],
      rate1:    ks[idx][1], rate2:    ks[idx + 1][1]
    });
  }
});

/* build up scales */
var rateRange = d3.extent(points.map(function(it) { return it.rate; }));
var sessionRange = d3.extent(points.map(function(it) { return it.session; }));
var xscale = d3.scale.linear()
  .domain([rateRange[0], -55, rateRange[1]]) /* distort -80% ~ -55% */
  .range([xmargin, xmargin * 2, width - xmargin]);
var xticks = xscale.ticks(10);
var yscale = d3.scale.linear()
  .domain(sessionRange)
  .range([ymargin, height - ymargin]);

block.coord = function(rate, session) { return [ xscale(rate), yscale(session) ]; };

/* build up header  */
var axis = d3.select("#head").append("svg")
  .attr({
    id: "tick",
    width: width,
    height: "70",
    viewBox: "0 0 " + width + " 70"
  });

axis.append("text").text("民進黨得票率較高 —-----> (單位：百分點)")
  .attr({
    x: xscale(5),
    y: 25,
    fill: colors.dpp.hint,
    "dominant-baseline": "central",
    "font-size": 13
  });

axis.append("text").text("(單位：百分點) <-----—  國民黨得票率較高")
  .attr({
    x: xscale(-5),
    y: 25,
    fill: colors.kmt.hint,
    "text-anchor": "end",
    "dominant-baseline": "central",
    "font-size": 13
  });

axis.append("line")
  .attr({
    x1: xscale(0),
    x2: xscale(0),
    y2: 45,
    y1: 10,
    stroke: "#999",
    "stroke-width": 1
  });

axis.selectAll("text.tick").data(xticks).enter().append("g")
  .append("text")
    .text(function(it) { return it; })
    .attr({
      class: "tick",
      x: function(it) { return block.coord(it,0)[0]; },
      y: 60,
      "text-anchor": "middle"
    });
/* build up header / end */

/* build up visualization */
var vis = d3.select("#container").append("svg")
  .attr({
    id: "vis",
    width: width,
    height: height,
    viewBox: [0, 0, width, height].join(" ")
  });

/* make gradient */
var defs = vis.append("defs");
function makeGradient(name, color1, color2) {
  var gradient = defs.append("linearGradient")
    .attr({
      id: name,
      x1: "0%",
      y1: "0%",
      x2: "0%",
      y2: "100%"
    });
  gradient.append("stop").attr({ offset: "0%" })
    .style({
      "stop-color": color1,
      "stop-opacity": 0.9
    });
  gradient.append("stop").attr({ offset: "100%" })
    .style({
      "stop-color": color2,
      "stop-opacity": 0.9
    });
}
makeGradient("gradient1", colors.dpp.gradient, colors.kmt.gradient);
makeGradient("gradient2", colors.kmt.gradient, colors.dpp.gradient);

/* vertical at middle */
vis.append("line")
  .attr({
    x1: xscale(0),
    x2: xscale(0),
    y1: 10,
    y2: height - ymargin + 1,
    stroke: "#999",
    "stroke-width": 1
  });

/* session tickers */
vis.selectAll("text.session").data([10,11,12,13,14]).enter().append("text")
  .attr({
    class: "ytick session",
    x: width - xmargin * 0.8,
    y: function(it) { return yscale(it); },
    dy: -6,
    "dominant-baseline": "central"
  }).text(function(it) { return "第" + it + "屆"; });

/* year tickers */
vis.selectAll("text.year").data([10,11,12,13,14]).enter().append("text")
  .attr({
    class: "ytick year",
    x: width - xmargin * 0.8,
    y: function(it) { return yscale(it); },
    dy: 6,
    "dominant-baseline": "central"
  }).text(function(it) { return (2000 + (it - 10) * 4) + "年" });

/* ellipsis dash lines */
vis.selectAll("line.omit").data([10,11,12,13,14]).enter().append("line")
  .attr({
    class: "omit",
    x1: xscale(-77),
    x2: xscale(-63),
    y1: function(it) { return yscale(it); },
    y2: function(it) { return yscale(it); },
    stroke: "#666",
    "stroke-width": 3,
    "stroke-dasharray": "3 3"
  });

/* vertical dash lines along each x ticker */
vis.selectAll("line.xtickline").data(xticks).enter().append("line")
  .attr({
    class: "xtickline",
    x1: function(it) { return xscale(it); },
    x2: function(it) { return xscale(it); },
    y1: 0,
    y2: height,
    stroke: "#aaa",
    "stroke-width": 0.5,
    "stroke-dasharray": "1 4"
  });

/* note aside with title and description. */
var notes = d3.select("#notes").selectAll(".note").data(rawNote).enter().append("div")
  .attr({class: "note"})
  .style({ top: function(it) { return yscale(it.session || 10) + "px"}});

/* note title */
notes.append("div")
  .attr({class: "title"})
  .text(function(it) { return it.title; });

/* note description */
notes.append("div")
  .attr({class: "desc"})
  .text(function(it) { return it.desc; });

/* thin note pointer points to right */
var notesptr = d3.select("#notes").selectAll(".point").data(rawNote).enter().append("div")
  .attr({class: "point"})
  .style({
    top: function(it) { return yscale(it.session) + "px"; },
    left: "190px",
    width: function(it) { return 20 + xscale(it.point) + "px"; }
  });

/* president name */
var zontons = vis.append("g").attr({class: "zonton-group"});
zontons.selectAll("text.president").data(president).enter().append("text")
  .attr({
    class: "president",
    x: function(it) { return xscale({kmt: -10, dpp: 10}[it[1]]); },
    y: function(it) { return yscale(+it[2]) - 20; },
    "text-anchor": "middle",
    "font-size": 18,
    "font-weight": "bold",
    fill: function(it) { return colors[it[1]].zonton; }
  }).text(function(it) { return it[0]; });

/* Now rendering the visualization */

/* Basic attributes for Rectangles */
var rectAttr = {
  x: function(it) { return block.coord(it.rate, it.session)[0] - block.width / 2; },
  y: function(it) { return block.coord(it.rate, it.session)[1] - block.height / 2; },
  width: block.width,
  height: block.height,
  fill: function(it) { 
    if(it.rate > 0) return colors.dpp.rectFill;
    else return colors.kmt.rectFill;
  },
  stroke: function(it) {
    if(it.rate > 0) return colors.dpp.rectStroke;
    else return colors.kmt.rectStroke;
  },
  "stroke-width": 1
};

/* Basic attributes for Curves */ 
var pathAttr = {
  d: function(it) {
    var coord1 = block.coord(it.rate1, it.session1);
    var coord2 = block.coord(it.rate2, it.session2);
    var x1 = coord1[0];
    var x2 = coord2[0];
    var y1 = coord1[1];
    var y2 = coord2[1];
    path = [
      ["M", (x1 - block.width / 2), ",", (y1 + block.height / 2)],
      ["C", (x1 - block.width / 2), ",", ((y1 + y2)/2), ",", 
            (x2 - block.width / 2), ",", ((y1 + y2)/2), ",",
            (x2 - block.width / 2), ",", (y2 - block.height / 2)],
      ["L", (x2 + block.width / 2), ",", (y2 - block.height / 2)],
      ["C", (x2 + block.width / 2), ",", ((y1 + y2)/2), ",",
            (x1 + block.width / 2), ",", ((y1 + y2)/2), ",",
            (x1 + block.width / 2), ",", (y1 + block.height / 2)],
      ["Z"]
    ].map(function(it) { return it.join(""); }).join("")
    return path;
  },
  fill: "rgba(0,0,0,0.1)"
};

/* handling mousemove event on curve lines and rectangles */
function mousemove(it) {
  var dx = $(vis[0]).offset().left;
  var dy = $(vis[0]).offset().top;
  var rate = it.rate || it.rate1;
  var session =  it.session || it.session1;
  var coord = block.coord(rate, session);
  var x = coord[0];
  var y = coord[1];
  mouse.county = it.county;
  prompt.style({
    top: (y - block.height / 2 - 10 - 75 + dy) + "px",
    left: (x - 70 + dx) + "px",
    display: "block"
  });
  prompt.select(".title").text(it.county);
  prompt.select(".rate").text(rate + "%");
  if(prompt.handle) clearTimeout(prompt.handle);
  prompt.handle = setTimeout(function(){ prompt.style({display: "none"}); }, 2000);
  render();
}

/* curve flow lines */
vis.selectAll("path.value").data(lines).enter().append("path")
  .attr({class:"value"})
  .on("mousemove", mousemove);

/* rectangles */
vis.selectAll("rect.value").data(points).enter().append("rect")
  .attr({class:"value"})
  .on("mousemove", mousemove);

hovers = vis.append("g").attr({class: "hover-group"});

function render() {
  vis.selectAll("rect.value").attr(rectAttr);
  vis.selectAll("path.value").attr(pathAttr);

  var pointsHover = points.filter(function(it) { return it.county == mouse.county; });
  var linesHover  = lines.filter( function(it) { return it.county == mouse.county; });
  var selection = null;
  selection = hovers.selectAll("path.hover").data(linesHover);
  selection.enter().append("path").attr({class:"hover"});
  selection.exit().remove();
  selection = hovers.selectAll("rect.hover").data(pointsHover);
  selection.enter().append("rect").attr({class:"hover"})
  selection.exit().remove();
  selection = hovers.selectAll("text.hover").data(pointsHover);
  selection.enter().append("text").attr({class:"hover"});
  selection.exit().remove();
  hovers.selectAll("rect.hover").attr(rectAttr).attr({
    stroke: "#000",
    "stroke-width": 2,
    fill: function(it) {
      if(it.rate > 0) return colors.dpp.hoverRectFill;
      else return colors.kmt.hoverRectFill;
    }
  });
  hovers.selectAll("path.hover").attr(pathAttr).attr({
    stroke: "#fff",
    "stroke-width": 1,
    fill: function(it) {
      if(it.rate2 < 0 && it.rate1 > 0) return 'url(#gradient1)';
      else if(it.rate2 > 0 && it.rate1 < 0) return 'url(#gradient2)';
      else if(it.rate2 > 0 && it.rate1 > 0) return colors.dpp.hoverPathFill;
      else if(it.rate2 < 0 && it.rate1 < 0) return colors.kmt.hoverPathFill;
      else return "rgba(0,0,0,0.2)";
    }
  });
  hovers.selectAll("text.hover")
    .attr({
      x: function(it) { return block.coord(it.rate, it.session)[0]; },
      y: function(it) { return block.coord(it.rate, it.session)[1] + block.height + 5; },
      "text-anchor": "middle",
      "stroke-width": 0.5,
      stroke: "#000",
      "font-size": "11px"
    }).text(function(it) { 
      return (it.rate > 0?"+":"") + it.rate + "%";
    });
} /* render */

render();

}); /* d3.json notes.json */
}); /* d3.csv vote.csv    */
}); /* document.ready     */
