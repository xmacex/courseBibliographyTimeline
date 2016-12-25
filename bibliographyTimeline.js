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
    this.nodes = [];
    this.edges = [];
    this.addNode = function(n) {
	this.nodes.push(n);
    }
    this.addEdge = function(s, t) {
	if(!this.edges.some(e => e.source == s && e.target == t)) {
	    this.edges.push(new Edge(s, t));
	} else {
	    this.edges.filter(e => e.source == s && e.target == t).forEach(e => {console.log("adding weight for " + e.target + ' -> ' + e.target); e.increaseWeight()});
	}
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

	    // graph of submissions/sources
	    referenceGraph = new Graph();
	    console.log("populating referenceGraph");
	    data.submissions.forEach(function(sub) {
		referenceGraph.addNode(sub);
		sub.references.forEach(function(source) {
		    referenceGraph.addEdge(sub, data.sources.find(function(l) {return l.ref == source}));
		})
	    });
	    console.log(referenceGraph);

	    /*
	    // graph of submissions/assignments
	    submissionGraph = new Graph();
	    console.log("populating submissionGraph");
	    data.assignments.forEach(function(a) {
		submissionGraph.addNode(a);
		data.submissions.forEach(function(s) {
		    submissionGraph.addEdge(s, data.assignments[a]);
		})
	    });
	    console.log(submissionGraph);
	    */

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
	    
	    // draw submissions
	    svg.selectAll("circle.submission")
		.data(data.submissions)
		.enter()
		.append("circle")
		.attr("class", "submission")
		.attr("cx", function(d, i) {return x(i)})
		.attr("cy", function(d) {return dateScale(parseDate(data.assignments.find(function(l) {return l.id == d.assignment}).deadline))})
		.attr("r", function(d) {return 3 + (d.references.length * 2)})

	    // draw readings
	    svg.selectAll("circle.source")
		.data(data.sources)
		.enter()
		.append("circle")
		.attr("class", "source")
		.classed("cited", d => referenceGraph.edges.some(e => e.target == d))
		.attr("cx", function(d, i) {return x(i)})
		.attr("cy", function(d) {return dateScale(parseDate(d.readingFor))})
		.attr("r", d => referenceGraph.edges.filter(e => e.target == d).length + 3)
		.text(function(d) {return d.author + ": " + d.title})
		.on("mouseover", function(d) {
		    d3.select(this).classed("highlight", true)
		    d3.selectAll("line.reference").filter(r => r.target == d).classed("highlight", true)
		    d3.selectAll("circle.submission").filter(s => s.references.some(r => r == d.ref)).classed("highlight", true)
		    d3.select("div#tooltip")
			.transition().duration(500)
			.style("left", (d3.event.pageX) + "px")
			.style("top", (d3.event.pageY) + "px")
			.style("opacity", "0.9")
		    	.text(d.author + ": " + d.title + " (" + d.year + ")")
		})
		.on("mouseout", function(d) {
		    d3.select(this).classed("highlight", false)
		    d3.selectAll("line.reference").filter(r => r.target == d).classed("highlight", false)
		    d3.selectAll("circle.submission").filter(s => s.references.some(r => r == d.ref)).classed("highlight", false)
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
