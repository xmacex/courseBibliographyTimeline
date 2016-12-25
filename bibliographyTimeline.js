var dataUrl = 'bibliography.json';
var bibliodata = null;

var height = window.innerHeight;
var width = window.innerWidth - 60;
var parseDate = d3.timeParse("%Y-%m-%d");
var dateScale = d3.scaleTime();
var x = d3.scaleLinear();
var yAxis = d3.axisLeft(dateScale)

var svg = d3.select("div#graph")
    .append("svg")
    .attr("id", "graph")
    .attr("height", height)
    .attr("width", width)

var Edge = function(s, t) {
    this.source = s;
    this.target = t;
    this.weight = 1;
    this.increaseWeight = function() {
	this.weight = this.weight + 1;
    }
}

var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")

var Graph = function() {
    this.nodes = new Set();
    this.edges = new Set();
    this.addNode = function(n) {
	this.nodes.add(n);
    }
    this.addEdge = function(s, t) {
	// I don't think this is working, because reference
	if(this.edges.has(Edge(s, t))) {
	    this.edges[Edge(s, t)].increaseWeight();
	} else {
	    this.edges.add(new Edge(s, t));
	}
    }
    this.getNodes = function() {
	return Array.from(this.nodes);
    }
    this.getEdges = function() {
	return Array.from(this.edges);
    }
}

d3.json(dataUrl,
	// accessor
	// function(d) {return true},
	// callback
	function(error, data) {
	    if(error) {
		throw error;
	    }
	    console.log(data);
	    bibliodata = data;

	    // validate references
	    data.submissions.forEach(function(sub) {
		sub.references.forEach(function(ref) {
		    if(!data.sources.find(function(source) {return source.ref == ref})) {
			console.log(sub);
		    }
		})
	    })

	    referenceGraph = new Graph();
	    // A better way to join?
	    data.submissions.forEach(function(sub) {
		referenceGraph.addNode(sub);
		sub.references.forEach(function(source) {
		    referenceGraph.addEdge(sub, data.sources.find(function(l) {return l.ref == source}));
		})
	    })

	    submissionGraph = new Graph();
	    data.assignments.forEach(function(a) {
		submissionGraph.addNode(a);
		data.submissions.forEach(function(s) {
		    submissionGraph.addEdge(s, data.assignments[a]);
		})
	    })

	    // set the scales
	    dateScale
		.domain([
		    d3.min(data.sources, function(d) {
			return parseDate(d.readingFor)}),
		    d3.max(data.assignments, function(d) {
			return parseDate(d.deadline)})
		])
		.range([height - 15, 30]);

	    x.domain([0, data.sources.length]).range([50 + 5, width - 5])

	    // draw submissions
	    svg.selectAll("circle.submission")
		.data(data.submissions)
		.enter()
		.append("circle")
		.attr("class", "submission")
		.attr("cx", function(d, i) {return x(i)})
		.attr("cy", function(d) {return dateScale(parseDate(data.assignments.find(function(l) {return l.id == d.assignment}).deadline))})
		.attr("r", function(d) {return 3 + (d.references.length * 2)})

	    // draw references
	    svg.selectAll("line.reference")
		.data(Array.from(referenceGraph.edges))
		.enter()
		.append("line")
		.attr("class", "reference")
		.attr("x1", function(d) {return x(data.submissions.indexOf(d.source))})
	    	.attr("y1", function(d) {return dateScale(parseDate(data.assignments.find(function(l) {return d.source.assignment == l.id}).deadline))})
		.attr("x2", function(d) {return x(data.sources.indexOf(d.target))})
	    	.attr("y2", function(d) {return dateScale(parseDate(d.target.readingFor))})

	    // draw readings
	    svg.selectAll("circle.source")
		.data(data.sources)
		.enter()
		.append("circle")
		.attr("class", "source")
		.attr("cx", function(d, i) {return x(i)})
		.attr("cy", function(d) {return dateScale(parseDate(d.readingFor))})
		.attr("r", function(d) {return 3 + Array.from(referenceGraph.edges).filter(function(l) {return l.target == d}).length})
		.text(function(d) {return d.author + ": " + d.title})
		.on("mouseover", function(d) {
		    d3.select(this).classed("highlight", true)
		    d3.selectAll("circle.submission").classed("highlight", true)
		    d3.select("div#tooltip")
			.transition().duration(500)
			.style("left", (d3.event.pageX) + "px")
			.style("top", (d3.event.pageY) + "px")
			.style("opacity", "0.9")
		    	.text(d.author + ": " + d.title + " (" + d.year + ")")
		})
		.on("mouseout", function(d) {
		    d3.select(this).classed("highlight", false)
		    d3.selectAll("circle.submission").classed("highlight", false)
		    d3.select("div#tooltip")
			.transition()
			.style("opacity", "0")
		})

	    // draw axes
	    svg.append("g")
		.attr("class", "axis yaxis")
	    	.attr("transform", "translate(50, 0)")
		.call(yAxis);
	});
