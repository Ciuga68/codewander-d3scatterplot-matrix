define( ["qlik", "text!./codewander-d3scatterplot-matrix.ng.html", "css!./codewander-d3scatterplot-matrix.css"
,"./lib/js/d3.v3.min"],
	function ( qlik, template,css,d3 ) {
		"use strict";
		return {
			template: template,
			initialProperties: {
				qHyperCubeDef: {
					qMode:"S",
					qDimensions: [],
					qMeasures: [],
					qInitialDataFetch: [{
						qWidth: 6	,
						qHeight: 1
					}]
				}
			},
			definition: {
				type: "items",
				component: "accordion",
				items: {
					dimensions: {
						uses: "dimensions",
						min: 1,
						max: 1
					},
					measures: {
						uses: "measures",
						min: 2,
						max: 5
					},
					settings:{
						uses: "settings",
						items:{
						Scroll:{
						type: "boolean",
						component: "switch",
						label: "Enable Scroll",
						ref: "enableScroll",
						options: [{
							value: true,
							label: "Yes"
						}, {
							value: false,
							label: "No"
						}],
						defaultValue: false					
						},
						plotSize:{
						ref:"plotSize",
						label: "Plot Size (px) - When scroll enabled",
						type: "string",
						defaultValue:"230"						
						},
						circleRadius:{
						ref:"circleRadius",
						label: "Circle Radius",
						type: "string",
						defaultValue:"4"						
						}
						}
					
					},
					sorting: {
						uses: "sorting"
					}
				}
			},
			support: {
				snapshot: true,
				export: true,
				exportData: true
			},
			paint: function (layout) {
				
				
				var self =this;
				var qElemNumber=[];
				var min_x=0;
				var max_x=0;
				var min_y=0;
				var max_y=0;
				var max_z=1;
				var dataMatrix=[];
				var cols=[];
				
				var dimensions_count= this.$scope.layout.qHyperCube.qDimensionInfo.length;
				var measures_count=this.$scope.layout.qHyperCube.qMeasureInfo.length;
				$(self.$element[0]).empty();
				$.each(this.$scope.layout.qHyperCube.qDimensionInfo,function(index,item){
				 	cols.push((item.title !=null && item.title!="")?item.title : item.qFallbackTitle);					
				});
				$.each(this.$scope.layout.qHyperCube.qMeasureInfo,function(index,item){
				 	cols.push((item.title !=null && item.title!="")?item.title : item.qFallbackTitle);					
				});				 
				//loop through the rows we have and render
				 this.backendApi.eachDataRow( function ( rownum, row ) {
							self.$scope.lastrow = rownum;
							dataMatrix.push(row);
				 });
				 
				var data=convert(dataMatrix);
				render(data);
				//needed for export
				this.$scope.selections = [];
				
				 if(this.backendApi.getRowCount() > self.$scope.lastrow +1){
						  var requestPage = [{
								qTop: self.$scope.lastrow + 1,
								qLeft: 0,
								qWidth: 10, //should be # of columns
								qHeight: Math.min( 1000, this.backendApi.getRowCount() - self.$scope.lastrow )
							}];

						   this.backendApi.getData( requestPage ).then( function ( dataPages ) {
									//when we get the result trigger paint again
									self.paint(layout );
						   } );
				 }
				 
				
				function convert(Matrix)
				{
				 var data=[];
				 $.each(Matrix,function(index,item){
				 	data[index]={};
				 	$.each(cols,function(col_index,col){
						data[index][col]= col_index<= dimensions_count-1 ? item[col_index].qText : item[col_index].qNum;
						if (col_index<= dimensions_count-1){
							//if(qElemNumber[col_index]==null)qElemNumber[col_index]={};
							data[index][col+"qElem"]=item[col_index].qElemNumber
							//qElemNumber[col_index][item[col_index].qText]=item[col_index].qElemNumber;
						}
						
						data[index][col+"display"]= item[col_index].qText;						
						
					})
				 })
				 return data;
				
				}
			
				function render(data){
				
				
				var width = self.$element[0].clientWidth,
					size = (self.$element[0].clientHeight/(measures_count))*.90 ,
					padding = 20;
									
					
				if (self.$scope.layout.enableScroll){
					width= self.$element[0].clientWidth;
					size= self.$scope.layout.plotSize;	
					$(self.$element[0]).addClass("enableScroll");
					$(self.$element[0]).removeClass("disableScroll");
					
				}
				else
				{
					$(self.$element[0]).addClass("disableScroll");	
					$(self.$element[0]).removeClass("enableScroll");	
					
				}
				var circle_radius= self.$scope.layout.circleRadius;

				var x = d3.scale.linear()
					.range([padding / 2, size - padding / 2]);

				var y = d3.scale.linear()
					.range([size - padding / 2, padding / 2]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.ticks(6);

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left")
					.ticks(6);

				var color = d3.scale.category10();

				/*d3.csv("https://raw.githubusercontent.com/vizydrop/data-samples/master/flowers.csv", function(error, data) {
				  if (error) throw error;*/
				  console.log(data);

				  var domainByTrait = {},
					  traits = d3.keys(data[0]).filter(function(d) { return d !== cols[0] && cols.indexOf(d)>-1; }),
					  n = traits.length;

				 
				  traits.forEach(function(trait) {
					domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
				  });

				  xAxis.tickSize(size * n);
				  yAxis.tickSize(-size * n);

				  var svg = d3.select(self.$element[0]).append("svg")
					  .attr("width", size * n + padding)
					  .attr("height", size * n + padding)
					  .append("g")
					  .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

				  svg.selectAll(".x.axis")
					  .data(traits)
					  .enter().append("g")
					  .attr("class", "x axis")
					  .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
					  .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

				  svg.selectAll(".y.axis")
					  .data(traits)
					  .enter().append("g")
					  .attr("class", "y axis")
					  .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
					  .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

				  var cell = svg.selectAll(".cell")
					  .data(cross(traits, traits))
					  .enter().append("g")
					  .attr("class", "cell")
					  .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
					  .each(plot);

				  // Titles for the diagonal.
				  cell.filter(function(d) { return d.i === d.j; }).append("text")
					  .attr("x", padding)
					  .attr("y", padding)
					  .attr("dy", ".71em")
					  .text(function(d) { return d.x; });

				  function plot(p) {
					var div = d3.select(self.$element[0]).append("div").attr("class", "toolTip");
					var cell = d3.select(this);

					x.domain(domainByTrait[p.x]);
					y.domain(domainByTrait[p.y]);

					cell.append("rect")
						.attr("class", "frame")
						.attr("x", padding / 2)
						.attr("y", padding / 2)
						.attr("width", size - padding)
						.attr("height", size - padding);

					cell.selectAll("circle")
						.data(data)
					  .enter().append("circle")
						.attr("cx", function(d) { return x(d[p.x]); })
						.attr("cy", function(d) { return y(d[p.y]); })
						.attr("r", circle_radius)
						.style("fill", function(d) { return color(d[cols[0]]); })
						.on("mousemove", function(d){
							div.style("left", d3.event.offsetX+"px");
							div.style("top", d3.event.offsetY+"px");
							div.style("display", "inline-block");
							var t="";
							for (var key in d) {
									if (d.hasOwnProperty(key) && d.hasOwnProperty(key+"display")) {
										t=t+key + " : " + d[key+"display"]+"<br>";
									}
								}							
							div.html(t);
						})
						.on("mouseout", function(d){
							div.style("display", "none");
						});	
						
					
					
					
				  }
				//});

				function cross(a, b) {
				  var c = [], n = a.length, m = b.length, i, j;
				  for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
				  return c;
				}

				}
			
			
				//needed for export
				this.$scope.selections = [];
				return qlik.Promise.resolve();
			},
			controller: ["$scope", "$element", function ( $scope ) {
				$scope.getPercent = function ( val ) {
					return Math.round( (val * 100 / $scope.layout.qHyperCube.qMeasureInfo[0].qMax) * 100 ) / 100;
				};
				
				
				$scope.lastrow = 0;
				
				$scope.selections = [];
				$scope.makeSelection = function (first, second){
					this.backendApi.selectValues(1,[first],true);
					this.backendApi.selectValues(2,[second],true);
					
				}

				$scope.sel = function ( $event ) {
					if ( $event.currentTarget.hasAttribute( "data-row" ) ) {
						var row = parseInt( $event.currentTarget.getAttribute( "data-row" ), 10 ), dim = 0,
							cell = $scope.$parent.layout.qHyperCube.qDataPages[0].qMatrix[row][0];
						if ( cell.qIsNull !== true ) {
							cell.qState = (cell.qState === "S" ? "O" : "S");
							if ( $scope.selections.indexOf( cell.qElemNumber ) === -1 ) {
								$scope.selections.push( cell.qElemNumber );
							} else {
								$scope.selections.splice( $scope.selections.indexOf( cell.qElemNumber ), 1 );
							}
							$scope.selectValues( dim, [cell.qElemNumber], true );
						}
					}
				};
			}]
		};

	} );
