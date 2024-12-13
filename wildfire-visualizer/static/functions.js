slider = document.getElementById("slider-input");
output = document.getElementById("year-id");
svg = d3.select("svg");


// Update the current slider value (each time you drag the slider handle)
slider.onchange = function() {
    output.textContent = this.value;
    refreshdata();
}

function increaseyear()
{
    output.textContent = parseInt(output.textContent) + 1;
    slider.value = parseInt(slider.value) + 1;
    slider.parentNode.style.setProperty('--value',slider.value); 
    slider.parentNode.style.setProperty('--text-value', JSON.stringify(slider.value));
    refreshdata();
}

function decreaseyear()
{
    output.textContent = parseInt(output.textContent) - 1;
    slider.value = parseInt(slider.value) - 1;
    slider.parentNode.style.setProperty('--value',slider.value); 
    slider.parentNode.style.setProperty('--text-value', JSON.stringify(slider.value));
    refreshdata();
}

function refreshdata() {
    refreshbuttons();
    renderbubbles();
    var result = document.overlayform.overlay.value;

    if (result == "precip") {
        renderprecip();
    } else if (result == "temp") {
        rendertemp();
    } else if (result == "heat") {
        renderheat();
    }
    refreshstats();
}




function refreshbuttons()
{
    var buttons = document.getElementsByClassName("year-btn");
    for (var i=0; i<buttons.length; i++) {
        buttons[i].disabled = false;
    }

    var yearid = parseInt(output.textContent);

    if (yearid >= 2020) {
        var buttonup = document.getElementById("year-up");
        buttonup.disabled = true;
    } else if (yearid <= 1992) {
        var buttondwn = document.getElementById("year-dwn");
        buttondwn.disabled = true;
    }
}

function refreshstats() {
    d3.csv("static/national_fire_data.csv", function(data) {
        var firenum = document.getElementById("firenum");
        var acrenum = document.getElementById("acrenum");
        var acreavg = document.getElementById("acreavg");
        var yearbio = document.getElementById("desc-container");
        if (document.getElementById("textanimate").checked) {
            yearbio.style.display = "block";   
            yearbio.classList.remove("showbox");
        } else {
            yearbio.style.display = "none";
        }
        yearbio.textContent = "";

        for (var i=0; i<data.length; i++) {
            if (data[i].year == parseInt(output.textContent)) {
                if (data[i].bio.length != 0) {
                    yearbio.classList.add("showbox");    
                    yearbio.textContent = data[i].bio;
                }

                firenum.setAttribute("finalval",data[i].firenum);
                acrenum.setAttribute("finalval",data[i].acreage);
                acreavg.setAttribute("finalval",data[i].avg);

                const counters = document.querySelectorAll('.counter');

                if (document.getElementById("textanimate").checked) {
                    
                    // iterate through all the counter elements
                    counters.forEach(counter => {
                    // function to increment the counter
                    function updateCount() {
                        const target = +counter.getAttribute('finalval');
                        const count = +counter.getAttribute("currentval");
                        const inc = Math.floor((target - count) / 5);

                        if ((count < target && inc > 0) || (count > target && inc < 0)) {
                            var newVal = Math.round((count + inc)*10)/10;
                            counter.setAttribute("currentval",newVal);
                            counter.innerHTML = newVal.toLocaleString();
                            // repeat the function
                            setTimeout(updateCount, 1);
                            // if the count not equal to target, then add remaining count
                        } else {
                            counter.setAttribute("currentval",target);
                            counter.innerHTML = target.toLocaleString();
                        }
                    }
                    updateCount();
                });
                } else {
                    if (data[i].bio.length != 0) {
                        yearbio.style.display = "block";   
                        yearbio.textContent = data[i].bio;
                    }
                    counters.forEach(counter => {
                        const target = +counter.getAttribute('finalval');
                        counter.setAttribute("currentval",target);
                        counter.innerHTML = target.toLocaleString();
                    })
                }
                return;
            }
        }
    })
}

function renderbubbles()
{
    var s = svg.selectAll("circle");
    s = s.remove();

    var yearid = parseInt(output.textContent);

    var div = d3.select(".hovertool");
    var file = `static/${yearid}_fires.csv`

    d3.csv(file, function(data) {
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("class", "bubble")
            .attr("cx", function(d) {
                return projection([d.lon, d.lat])[0];
            })
            .attr("cy", function(d) {
                return projection([d.lon, d.lat])[1];
            })
            .attr("r", 1)
                .style("fill", "rgb(217,100,80)")	
                .style("opacity", 0.5)	
            
            

            // Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
            // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
            .on("mouseover", function(d) {   

                div
                .transition()        
                .duration(100)      
                .style("opacity", 1);

                var nameTag = d3.select(".nametag");
                var acreTag = d3.select(".acretag");
                var reporterTag = d3.select(".reportertag");
                var causeTag = d3.select(".causetag");

                nameTag.text(d.name);     
                acreTag.text(Math.round(d.acres).toLocaleString() + " acres");
                reporterTag.text(d.reporter);
                causeTag.text(d.cause);                
            })   
        
            // fade out tooltip on mouse out               
            .on("mouseout", function(d) {       
                div.transition()        
                .duration(150)      
                .style("opacity", 0);   
            });

        updatebubbles();
    });  


    function updatebubbles() {
        svg.selectAll("circle")
            .transition()
            .duration(400)
            .attr("r", function(d) {
                return Math.sqrt(d.acres/1000);
            })
    }
}




function loadoverlay() {
    var result = document.overlayform.overlay.value;
    removelayers();
    if (result == "forests") {
        renderforests();
    } else if (result == "precip") {
        loadclimatedivisions();
        setTimeout(renderprecip, 200);
        if (window.innerWidth > 850) {
            var legend = document.getElementById("precip-legend");
            legend.classList.add("visible");
        } else {
            var legend = document.getElementById("precip-legend-mobile");
            legend.classList.add("visible");
        }
    } else if (result == "temp") {
        loadclimatedivisions();
        setTimeout(rendertemp, 200);
        if (window.innerWidth > 850) {
            var legend = document.getElementById("temp-legend");
            legend.classList.add("visible");
        } else {
            var legend = document.getElementById("temp-legend-mobile");
            legend.classList.add("visible");
        }
    } else if (result == "heat") {
        loadclimatedivisions();
        setTimeout(renderheat, 200);
        if (window.innerWidth > 850) {
            var legend = document.getElementById("heat-legend");
            legend.classList.add("visible");
        } else {
            var legend = document.getElementById("heat-legend-mobile");
            legend.classList.add("visible");
        }
    }
    return renderbubbles();
}

function removelayers() {
    s = svg.selectAll(".division");
    s = s.remove();
    var legends = document.getElementsByClassName("legend");
    for (var i=0; i<legends.length; i++) {
        legends[i].classList.remove("visible");
    }
}

function loadclimatedivisions() {
    d3.json("../static/climate_divisions.json", function(data) {
		var divisions = topojson.feature(data, data.objects.GIS).features;
		svg.selectAll("division")
			.data(divisions)
			.enter()
			.append("path")
			.attr("class","division")
			.attr("d", path)
			.style("stroke", "grey")
			.style("stroke-width", "0")
			.style("fill","rgb(255,255,255,0)");
    });
}

function renderforests() {
    d3.json("../static/forests_simple_topo.json", function(json) {
		svg
			.datum(topojson.mesh(json))
			.append("path")
            .attr("class","division")
			.attr("d", path)
				.style("stroke-width", "0")
				.style("fill","rgb(20, 128, 74, 0)");
        transitionforests();
		}
	);
}

function transitionforests() {
    svg.selectAll(".division")
        .transition()
        .duration(500)
        .style("fill","rgb(20, 128, 74, 0.2)");
}

function renderprecip() {
    var yearid = parseInt(output.textContent);
    var file = `../static/${yearid}_precip.csv`;
    var div = d3.select(".legendtool");

    d3.csv(file, function(data) {
        
        var color = d3.scaleLinear()
		.domain([0,40])
		.range(["rgb(245,245,245,0.7)", "rgb(40,40,245,0.7)"]);

        svg.selectAll(".division")
            .text(function(d) {
                for (var i=0; i<data.length; i++) {
                    if (data[i].id == d.properties.CLIMDIV) {
                        return data[i].value;
                    }
                }            
            })

            .on("mouseover", function() {   
                div
                .text(d3.select(this).text()+"\"");   
                
                div
                .transition()        
                .duration(100)      
                .style("opacity", 1);
            })   

            .on("mousemove", function(d) {
                div
                .style("top", (d3.event.pageY+10)+"px")
                .style("left",(d3.event.pageX+10)+"px");
            })
        
            // fade out tooltip on mouse out               
            .on("mouseout", function() {       
                div
                .transition()        
                .duration(150)      
                .style("opacity", 0);   
            });

        svg.selectAll(".division")
            .transition()
            .duration(300)
            .style("fill",function(d) {
                return color(d3.select(this).text());
            });

    })
}

function rendertemp() {
    var yearid = parseInt(output.textContent);
    var file = `../static/${yearid}_heat.csv`;
    var div = d3.select(".legendtool");

    d3.csv(file, function(data) {
        
        var color = d3.scaleLinear()
		.domain([50,95])
		.range(["rgb(255,255,255,0.65)", "rgb(60,60,60,0.65)"]);

        svg.selectAll(".division")
            .text(function(d) {
                for (var i=0; i<data.length; i++) {
                    if (data[i].id == d.properties.CLIMDIV) {
                        return data[i].value;
                    }
                }            
            })

            .on("mouseover", function() {   
                div
                .transition()        
                .duration(100)      
                .style("opacity", 1)
                .text(Math.round(d3.select(this).text()*10)/10+"°F");                           
            })   

            .on("mousemove", function(d) {
                div
                .style("top", (d3.event.pageY+10)+"px")
                .style("left",(d3.event.pageX+10)+"px");
            })
        
            // fade out tooltip on mouse out               
            .on("mouseout", function() {       
                div
                .transition()        
                .duration(150)      
                .style("opacity", 0);   
            });

        svg.selectAll(".division")
            .transition()
            .duration(300)
            .style("fill",function(d) {
                return color(d3.select(this).text());
            });
    });
}

function renderheat() {
    var yearid = parseInt(output.textContent);
    var file = `../static/${yearid}_heat.csv`;
    var div = d3.select(".legendtool");

    d3.csv(file, function(data) {
        
        var color = d3.scaleLinear()
		.domain([-9,0,9])
		.range(["rgb(40,40,245,0.6)", "rgb(230,210,230,0.6)", "rgb(245,40,40,0.6)"]);

        svg.selectAll(".division")
            .text(function(d) {
                for (var i=0; i<data.length; i++) {
                    if (data[i].id == d.properties.CLIMDIV) {
                        return data[i].anomaly;
                    }
                }            
            })

            .on("mouseover", function() {   
                div
                .transition()        
                .duration(100)      
                .style("opacity", 1)
                .text(Math.round(d3.select(this).text()*10)/10+"°F");                           
            })   

            .on("mousemove", function(d) {
                div
                .style("top", (d3.event.pageY+10)+"px")
                .style("left",(d3.event.pageX+10)+"px");
            })
        
            // fade out tooltip on mouse out               
            .on("mouseout", function() {       
                div
                .transition()        
                .duration(150)      
                .style("opacity", 0);   
            });

        svg.selectAll(".division")
            .transition()
            .duration(300)
            .style("fill",function(d) {
                return color(d3.select(this).text());
            });
    });
}


function openInfo()
{
  var popup = document.getElementById("info-modal");
  popup.style.display = "inline";
  removecontrols();
}

function closeInfo()
{
  var modal = document.getElementById("info-modal");
  modal.style.display = "none";
  animatecontrols();
}

function animatecontrols() {
    var controls = document.getElementsByClassName("time-control");
    for (var i=0; i<controls.length; i++) {
        controls[i].classList.add("active");
    }
}

function removecontrols() {
    var controls = document.getElementsByClassName("time-control");
    for (var i=0; i<controls.length; i++) {
        controls[i].classList.remove("active");
    }
}
