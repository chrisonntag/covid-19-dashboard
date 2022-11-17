<template>
  <div class="vis-component" ref="chart">
    <section class="featureSelect">
      <b-field class="featureSelectField">
        <b-select size="is-small" placeholder="Choose a Country feature" v-model="selectedColorFeature" @input="drawBars" required>
          <option v-for="item of features" :value="item" :key="item">{{item.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ")}}</option>
        </b-select>
      </b-field>
    </section>
    <section class="chartSection">
      <b-tooltip id="tooltip" ref="tooltip" position="is-bottom">
        <template v-slot:content>
        </template>
      </b-tooltip>
      <svg class="main-svg" width="100%" height="100%">
        <g class="chart-group" ref="chartGroup">
          <g class="axis axis-x" ref="axisX"></g>
          <g class="axis axis-y" ref="axisY"></g>
          <g class="bar-group" ref="barsGroup"></g>
          <g class="legend" ref="legend"></g>
        </g>
      </svg>
    </section>
  </div>
</template>

<script>
import * as d3Base from "d3";
import {legendSize} from "d3-svg-legend";

const d3 = Object.assign(d3Base, { legendSize })

export default {
  name: 'Histogram',
  props: {
  },
  data() {
    return {
      svgWidth: 500,
      svgHeight: 500,
      svgPadding: {
        top: 20, right: 20, bottom: 40, left: 50,
      },
      selectedColorFeature: 'new_vaccinations_smoothed_per_million',
      allowedColorFeatures: ['new_vaccinations_smoothed_per_million'],
      selectedYFeature: 'new_cases_smoothed_per_million',
      allowedYFeatures: ['new_cases_smoothed_per_million'],
      featureColors: {
        'new_vaccinations_smoothed_per_million': d3.schemeBlues[9],
      },
    }
  },
  mounted() {
    this.drawChart();
  },
  methods: {
    drawChart() {
      if (this.$refs.chart) {
        this.svgWidth = this.$refs.chart.clientWidth;
        this.svgHeight = this.$refs.chart.clientHeight;
      }
      d3.select(this.$refs.chartGroup)
          .attr('transform', `translate(${this.svgPadding.left},${this.svgPadding.top})`)
          .on('click', this.handleClick);
      this.drawXAxis();
    },
    drawXAxis() {
      d3.select(this.$refs.axisX)
          .attr('transform', `translate( 0, ${this.svgHeight - this.svgPadding.top - this.svgPadding.bottom} )`)
          .call(d3.axisBottom(this.xScale))
          .append('text')
          .attr('x', this.svgWidth - this.svgPadding.right * 3)
          .attr('dy', '3em')
          .attr('text-anchor', 'end')
          .attr('fill', 'black')
          .text("Dates");
    },
    drawYAxis(scale) {
      d3.select(this.$refs.axisY)
          .call(d3.axisLeft(scale).tickFormat(d3.format("~s")))
          .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '-4em')
          .attr('text-anchor', 'end')
          .attr('fill', 'black')
          .text(this.beautifyFeatureName(this.selectedColorFeature));
    },
    beautifyFeatureName(name) {
      return name.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ");
    },
    drawBars() {
      const barsGroup = d3.select(this.$refs.barsGroup);
      //const tooltip = d3.select("#tooltip");
      //const tooltipcontent = d3.select("#tooltip > .tooltip-content");
      //const that = this;

      let data = this.yFeatureData;
      console.log(data);
      let bins = this.histogram(this.yFeatureData);

      let yScale = d3.scaleLinear()
          .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0])
          .domain([0, d3.max(bins, (d) => d.length)]);

      this.drawYAxis(yScale);

      barsGroup.selectAll('.bar')
          .data(bins)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr("x", 1)
          .attr("transform", (d) => "translate(" + this.xScale(d.x0) + "," + yScale(d.length) + ")")
          .attr("width", (d) => this.xScale(d.x1) - this.xScale(d.x0) - 1)
          .attr("height", (d) => this.svgHeight - yScale(d.length))
          /*
          .attr('x', (d) => this.xScale(d.x))
          .attr('y', (d) => this.yScale(d.y))
          .attr('width', "2")
          .attr('height', (d) => this.svgHeight - this.svgPadding.top - this.svgPadding.bottom - this.yScale(d.y))
          */
          //.style("fill", (d) => this.colorScale(d.color))
          .on('click', (event, d) => console.log("Event: " + event + "\nd: " + d));
          /*
          .on('mouseover', function(e) {
            console.log(e.target.dataset)
            tooltipcontent.html(
                "<b>" + that.countryNameDict[e.target.dataset.country] + "</b><br>"
                + that.beautifyFeatureName(that.selectedXFeature) + ": " + e.target.dataset.x + "<br>"
                + that.beautifyFeatureName(that.infectionRateFeature) + ": " + e.target.dataset.y + "<br>"
                + that.beautifyFeatureName(that.selectedCountryFeature) + ": " + e.target.dataset.r
            );
            tooltip
                .style('left', e.pageX + 'px')
                .style('top', (e.pageY) + 'px');
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            tooltipcontent.transition()
                .style("display", "block")
          })
          .on('mouseout', function() {
            tooltip.transition()
                .duration(300)
                .style('opacity', 0);
          });

           */
    },
    handleClick(e) {
      const dots = d3.select(this.$refs.scatterGroup).selectAll('.dot');
      if (!(e.target.classList.contains('dot'))) {
        this.$store.commit('cleanSelectedCountries');
        dots.attr("class", "dot");
      }
    },
  },
  computed: {
    data: {
      get() {
        return this.$store.getters.data;
      }
    },
    featureData: {
      get() {
        let feature_values = [];
        this.data.forEach((d) => {
          feature_values.push({
            x: d.date,
            y: d[this.selectedYFeature],
            color: d[this.selectedColorFeature]
          })
        });

        return feature_values;
      }
    },
    xData: {
      get() {
        return this.data.map((d) => new Date(d["date"]));
      }
    },
    yFeatureData: {
      get() {
        return this.data[this.selectedYFeature];
      }
    },
    colorFeatureData: {
      get() {
        return this.data[this.selectedColorFeature];
      }
    },
    features: {
      get() {
        return this.$store.getters.features.filter((item) => this.allowedColorFeatures.indexOf(item) >= 0);
      }
    },
    countries: {
      get() {
        return this.$store.getters.countries;
      }
    },
    selectedCountries: {
      get() {
        return this.$store.getters.selectedCountries;
      }
    },
    countryNameDict: {
      get() {
        return this.$store.getters.countryNameDict;
      }
    },
    colorFeatureMin() {
      return d3.min(this.data, (d) => d[this.selectedColorFeature])
    },
    colorFeatureMax() {
      return d3.max(this.data, (d) => d[this.selectedColorFeature])
    },
    timeMax() {
      return d3.max(this.data, (d) => d["date"])
    },
    timeMin() {
      return d3.min(this.data, (d) => d["date"])
    },
    yfeatureMax() {
      return d3.max(this.data, (d) => d[this.selectedYFeature]);
    },
    yfeatureMin() {
      return d3.min(this.data, (d) => d[this.selectedYFeature]);
    },
    colorScale() {
      return d3.scaleLog()
          .domain([this.colorFeatureMin > 0 ? 0 : this.colorFeatureMin, this.colorFeatureMax])
          .range(this.featureColors[this.selectedColorFeature])
    },
    xScale() {
      return d3.scaleTime()
          .rangeRound([0, this.svgWidth - this.svgPadding.left - this.svgPadding.right])
          .domain([new Date(this.timeMin), new Date(this.timeMax)]);
    },
    histogram() {
      return d3.histogram()
          .domain(this.xScale.domain())
          .thresholds(this.xScale.ticks(30));
    }
  },
  watch: {
    data: {
      handler() {
        this.drawBars();
      },
      deep: true,
    },
    yFeatureData: {
      handler() {
        this.drawBars();
      },
      deep: true,
    }
  },
}
</script>

<style>

#tooltip {
  opacity: 0;
  position: absolute;
}

.dot {
}
.dot.brushed {
  fill: #fff !important;
  stroke: black;
  stroke-width: 1;
}

.featureSelect {
  position: absolute;
  right: 0;
  margin-right: 12px;
  opacity: 0.6;

  -webkit-transition: opacity 0.1s linear;
  -moz-transition: opacity 0.1s linear;
  transition: opacity 0.1s linear;
}
.featureSelect:hover {
  opacity: 1;
}
.featureSelectField {
  float: right;
}

.chartSection {
  height: 100%;
}
</style>
