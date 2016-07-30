$(function() {
	var css = '#speedStats {font-family: "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace; text-align: center; margin-top: 40px;}' +
		' #speedGraph {display: none;height: 500px; width: 80%; background-color: white; border-radius: 5px; position: absolute; border: 1px solid black;' +
		' top: 180px; left: 0; right: 0; margin: 0 auto} .bar {fill: steelblue; } .bar:hover {fill: goldenrod} .axis text {font: 10px sans-serif;}' +
		' .axis path, .axis line {fill: none;stroke: #000;shape-rendering: crispEdges;} .x.axis path {display: none;}' +
		' div.tooltip {position: absolute;text-align: center;width: 250px;padding: 2px;font: 16px monospace;background: white;' +
		' border: 1px solid black; pointer-events: none;}',
	style = $('<style type="text/css">'),
	d3 = $('<script src="https://d3js.org/d3.v3.min.js" charset="utf-8">');


	$('head').append(d3);
	$(style).html(css);
	$('head').append(style);

	var startScript = setInterval(function() {
		if(coordsAll) {
			clearInterval(startScript);
			$('#panel').css("margin-top", "-90px");
			buildSpeedGraph();
		}
	}, 1000);
});

function buildSpeedGraph () {
	var speedArr = [],
	speedByTimestamp = {},
	distByTimestamp = {},
	durByTime = {},
	d3Data = [],
	avg,
	sum,
	max,
	speedGraph = $('<div id="speedGraph">'),
	chart = $('<svg id="speedSVG" class="chart">'),
	graph = $('<svg id="maxSVG" class="graph" style="position: absolute; top:0; left: 0;">'),
	sgClose = $('<div id="speedgraphClose" style="cursor: pointer; position:absolute; right: 5px; top: 5px; font-size:16px">X</div>');

	$(sgClose).on("click", function() {
		$('#speedGraph').hide();
		$('#speedGraphIt').html('Graph It');
	});

	$(speedGraph).append(sgClose);

	console.log('Building speed graph..');
	for(date in coordsAll) {
		if(!speedByTimestamp[date]) {
			speedByTimestamp[date] = []
		}

		coordsAll[date].forEach(function(arr, i) {
			speedArr.push(arr.speed * 2.23694);
			speedByTimestamp[date].push(arr.speed * 2.23694);

			if(i === coordsAll[date].length - 1) {
				distByTimestamp[date] = arr.dist;

				var routeTime = parseRouteDate(date),
					startTime = new Date(routeTime),
  					endTime = new Date(routeTime + (coordsAll[date].length * 1000));
				durByTime[date] = (endTime - startTime)/1000/60;
			}
		});
	}

	for(keys in speedByTimestamp) {
		var driveSum = speedByTimestamp[keys].reduce(function(a,b) {return a + b;}),
			driveAvg = driveSum/speedByTimestamp[keys].length,
			driveMax;

		speedByTimestamp[keys].sort(function(a,b) {return b - a;});
		driveMax = speedByTimestamp[keys][0].toFixed(2);
		driveAvg = driveAvg.toFixed(2);

		d3Data.push({timestamp: keys, driveAvg: +driveAvg, driveMax: +driveMax, distance: +distByTimestamp[keys].toFixed(2), duration: +durByTime[keys].toFixed(2)});
	}

	d3Data.sort(function(a,b) {
		var aTime = a.timestamp.substr(0,10) + a.timestamp.substr(12),
			bTime = b.timestamp.substr(0,10) + b.timestamp.substr(12);

			aArr = aTime.split('-');
			bArr = bTime.split('-');

		for(var i = 0; i < aTime.length; i++) {
			if(aTime[i] > bTime[i]) return 1;
			if(aTime[i] < bTime[i]) return -1;
		}
		return 0;
	});

	if(d3Data.length > 80) d3Data.splice(0, d3Data.length - 80);

	speedArr.sort(function(a,b) {
		return b - a
	});

	sum = speedArr.reduce(function(a, b) {
		return a + b;
	});

	avg = sum/speedArr.length;
	avg = avg.toFixed(2);
	max = speedArr[0].toFixed(2);

	$('#title').after('<h4 id="speedStats">Overall Average Speed: ' + avg + 'mph, Max Speed: ' + max + 'mph <a id="speedGraphIt" style="cursor:pointer;">Graph It</a></h4>');

	$('#speedGraphIt').on("click", function() {
		$('#speedGraph').show();
		$('#speedGraphIt').html('Hover over bars to see stats for that day.')
	});

	$(speedGraph).append(graph);
	$(speedGraph).append(chart);
	$('body').append(speedGraph);

//--
	var margin = {top: 20, right: 30, bottom: 40, left: 40},
    width = $('#speedGraph').width() - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

	var x = d3.scale.ordinal()
	    .rangeRoundBands([0, width], .1);

	var y = d3.scale.linear()
	    .range([height, 0]);

	var xAxis = d3.svg.axis()
	    .scale(x)
	    .orient("bottom")
	    .tickFormat(function(d) {
		  	var temp = d.substr(0, 10);
		  	var tArr = temp.split('-');
		  	return tArr[1] + "/" + tArr[2];
	  });

	var yAxis = d3.svg.axis()
	    .scale(y)
	    .orient("left");

  var tooltip = d3.select("#speedGraph").append("div")
	    .attr("class", "tooltip")
	    .style("opacity", 0);

	var chart = d3.select(".chart")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	  x.domain(d3Data.map(function(d) { return d.timestamp; }));
	  y.domain([0, d3.max(d3Data, function(d) { return d.driveMax; })]);

	  chart.append("g")
	      .attr("class", "x axis")
	      .attr("transform", "translate(0," + height + ")")
	      .call(xAxis)
	      .selectAll("text")
	      .attr("y", 0)
		    .attr("x", 9)
		    .attr("dy", ".35em")
		    .attr("transform", "rotate(45) translate(-3 6)")
		    .style("text-anchor", "start");

	  chart.append("g")
	      .attr("class", "y axis")
	      .call(yAxis)
	      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("mph");

	  chart.selectAll(".bar")
	      .data(d3Data)
	    .enter().append("rect")
	      .attr("class", "bar")
	      .attr("x", function(d) { return x(d.timestamp); })
	      .attr("y", function(d) { return y(d.driveAvg); })
	      .attr("height", function(d) {return height - y(d.driveAvg); })
	      .attr("width", x.rangeBand())
	      .on("mouseover", function(d) {
	      	tooltip.transition()
	      		.duration(200)
	      		.style("opacity", .9)
      			.style("left", function() {return x(d.timestamp) - 70 + "px"})
      			.style("top", function() {return height - (height - y(d.driveMax)) - $('.tooltip').height() + "px"});
      		tooltip.html("Timestamp: <span style='font-size: 10px'>" + d.timestamp + "</span><br/>Drive Avg: " + d.driveAvg + "mph<br/>Drive Max: " + d.driveMax + "mph<br/>Distance: " + d.distance + "mi<br/>Duration: " + d.duration + " minutes");
	      })
	      .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            });

			var barWidth = $(".bar").attr("width");

			var line = d3.svg.line()
			    .x(function(d) { return x(d.timestamp) + barWidth/2 - 1; })
			    .y(function(d) { return y(d.driveMax); })
					.interpolate("basis");

			chart.append("path")
					.datum(d3Data)
					.attr("stroke", "goldenrod")
					.attr("stroke-width", 2)
					.attr("class", "line")
					.attr("fill","none")
					.attr("d", line);

					console.log('done');
}
