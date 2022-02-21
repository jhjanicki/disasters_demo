//******************
// Responsive setup
//******************
var windowWidth = $(window).width();
var windowHeight = $(window).height();
var viewportWidth = Math.max(
  document.documentElement.clientWidth,
  window.innerWidth || 0
);
var viewportHeight = Math.max(
  document.documentElement.clientHeight,
  window.innerHeight || 0
);

$(window).resize(function () {
  if (
    windowWidth != $(window).width() ||
    windowHeight != $(window).height()
  ) {
    location.reload();
    return;
  }
});

var width = $("#chart").parent().width();
var height = 600;
var margin = { top: 30, right: 70, left: 30, bottom: 130 };

var disasters = disasters.sort(
  (a, b) => parseFloat(a.year) - parseFloat(b.year)
);
var disasters2014 = disasters.filter((d) => d.year >= 2014);
var yearGroups = d3.group(disasters2014, (d) => d.year);
var countryGroups = d3.group(disasters2014, (d) => d.country);

var groups = d3.group(disasters2014, (d) => d.year);
var countries = [...new Set(disasters2014.map((item) => item.country))];
var years = [...new Set(disasters2014.map((item) => item.year))].sort();

var x = d3
  .scaleBand()
  .domain(years)
  .range([margin.left, width - margin.right]);
var y = d3
  .scaleBand()
  .domain(countries)
  .range([height - margin.top - margin.bottom, 0]);
var r = d3
  .scaleSqrt()
  .domain(d3.extent(disasters2014, (d) => d.total_deaths_affected))
  .range([3, 35]);
var color = d3
  .scaleOrdinal()
  .domain(["Drought", "Flood"])
  .range(["#EAA69F", "#79AFE7"]);

var xAxis = (g) =>
  g
    .call(d3.axisTop(x).tickFormat((d) => `${d}`))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").remove())
    .call((g) =>
      g
        .append("text")
        .attr("x", innerWidth)
        .attr("y", 20)
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
    );

var yAxis = (yAxis = (g) =>
  g
    .call(d3.axisLeft(y).ticks(8))
    .call((g) => g.select(".domain").remove())
    .call((g) => g.selectAll(".tick line").remove()));

var svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var force = d3
  .forceSimulation(disasters2014)
  .force("charge", d3.forceManyBody().strength(0))
  .force(
    "x",
    d3.forceX().x((d) => x(d.year))
  )
  .force("y", d3.forceY((height - margin.top - margin.bottom) / 2))
  .force(
    "collision",
    d3.forceCollide().radius((d) => r(d.total_deaths_affected) + 1)
  );

var wrapper = svg
  .append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add x-Axis
wrapper
  .append("g")
  .attr("transform", `translate(-15,0)`) //not sure why I need to do this to have it align
  .attr("class", "x-axis")
  .call(xAxis);

var yAxisContainer = wrapper.append("g").attr("class", "y-axis");

var circles = wrapper
  .append("g")
  .selectAll("circle")
  .data(disasters2014)
  .join("circle")
  .attr("class", "circles")
  .attr("r", (d) => r(d.total_deaths_affected))
  .attr("fill", (d) => color(d.disaster))
  .attr("x", (d) => x(d.year))
  .attr("y", (d) => y(d.country) + y.bandwidth() / 2);

force.on("tick", () => {
  circles
    .transition()
    .ease(d3.easeLinear)
    .attr("cx", (d) => d.x + x.bandwidth() / 2)
    .attr("cy", (d) => d.y);
});

//set up and draw legend
var legendSizeG = wrapper
  .append("g")
  .attr("class", "legendSize")
  .attr("transform", `translate(0,${height - 130})`);
var legendColorG = wrapper
  .append("g")
  .attr("class", "legendColor")
  .attr("transform", `translate(240,${height - 100})`);
var legendSize = d3
  .legendSize()
  .scale(r)
  .shape("circle")
  .cells([10000, 100000, 1000000, 5000000])
  .shapePadding(35)
  .labelOffset(10)
  .labelFormat(d3.format(".0f"))
  .orient("horizontal")
  .title("Number of people affected");

var legendColor = d3
  .legendColor()
  .shapeWidth(40)
  .orient("horizontal")
  .scale(color);

wrapper.select(".legendSize").call(legendSize);

wrapper.select(".legendColor").call(legendColor);

d3.select(".legendSize")
  .select(".legendCells")
  .selectAll(".cell circle")
  .attr("fill", "none")
  .attr("stroke", "black");

var allYear = true;

d3.select("#click").on("click", function () {
  redraw();
});

function redraw() {
  if (allYear) {
    allYear = false;
    y.domain(countries);
    y.range([height - margin.top - margin.bottom, 0]);
    yAxisContainer
      .call(yAxis, y, countries)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove());
    // Update simulation
    force.force(
      "y",
      d3.forceY((d) => y(d.country) + y.bandwidth() / 2)
    );
    force.alpha(1).restart();
  } else {
    allYear = true;
    y.domain(["All"]);
    y.range([height - margin.top - margin.bottom, 0]);
    // Update domain of y-Axis
    yAxisContainer
      .call(yAxis, y, ["All"])
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").remove());
    // Update simulation
    force.force(
      "y",
      d3.forceY((height - margin.top - margin.bottom) / 2)
    );
    force.alpha(1).restart();
  }
}