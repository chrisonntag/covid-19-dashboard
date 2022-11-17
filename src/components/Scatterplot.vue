<template>
  <div class="vis-component" ref="chart">
    <section class="featureSelect">
      <b-field class="featureSelectField">
        <b-select size="is-small"  placeholder="Choose a Country feature" v-model="selectedCountryFeature" @input="scatter" required>
          <option v-for="item of countryFeatures" :value="item" :key="item">{{item.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ")}}</option>
        </b-select>
      </b-field>
      <b-field>
        <b-select size="is-small"  placeholder="Choose a feature" v-model="selectedXFeature" @input="scatter" required>
          <option v-for="item of xFeatures" :value="item" :key="item">{{item.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ")}}</option>
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
          <g class="brush" ref="brush"></g>
          <g class="scatter-group" ref="scatterGroup"></g>
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
  name: 'Scatterplot',
  props: {
  },
  data() {
    return {
      idleTimeout: null,
      brush: d3.brush(),
      svgWidth: 500,
      svgHeight: 500,
      svgPadding: {
        top: 20, right: 20, bottom: 40, left: 50,
      },
      selectedCountryFeature: 'population',
      selectedXFeature: 'people_fully_vaccinated_per_hundred',
      allowedCountryFeatures: ['population', 'stringency_index', 'median_age', 'gdp_per_capita'],
      allowedXFeatures: ['people_fully_vaccinated_per_hundred', 'new_people_vaccinated_smoothed_per_hundred',
        'total_tests_per_thousand', 'total_boosters_per_hundred', 'weekly_hosp_admissions_per_million', 'reproduction_rate'],
      infectionRateFeature: 'new_cases_per_million',
      featureColors: {
      },
    }
  },
  mounted() {
    this.drawChart();
    this.selectAllCountries();
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
      this.drawYAxis();
      this.scatter(false);
      this.initBrush();
      //this.updateCountryColors();
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
          .text(this.beautifyFeatureName(this.selectedXFeature));
    },
    drawYAxis() {
      d3.select(this.$refs.axisY)
          .call(d3.axisLeft(this.yScale).tickFormat(d3.format("~s")))
          .append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 6)
          .attr('dy', '-4em')
          .attr('text-anchor', 'end')
          .attr('fill', 'black')
          .text(this.beautifyFeatureName(this.infectionRateFeature));
    },
    beautifyFeatureName(name) {
      return name.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ");
    },
    scatter(onlySelected=false) {
      const scatterGroup = d3.select(this.$refs.scatterGroup);
      const tooltip = d3.select("#tooltip");
      const tooltipcontent = d3.select("#tooltip > .tooltip-content");
      const that = this;

      let data = d3.zip(this.xFeatureData, this.infectionRateData, this.countryFeatureData);
      if (onlySelected) {
        data = d3.zip(
            this.xFeatureData.filter((d) => this.selectedCountries.indexOf(d.country) >= 0),
            this.infectionRateData.filter((d) => this.selectedCountries.indexOf(d.country) >= 0),
            this.countryFeatureData.filter((d) => this.selectedCountries.indexOf(d.country) >= 0)
      );
      }

      scatterGroup.selectAll('.dot').remove();
      scatterGroup.selectAll('.dot')
          .data(data)
          .enter()
          .append('circle')
          .attr('r', (d) => this.rScale(d[2].value))
          .attr('cx', (d) => this.xScale(d[0].value))
          .attr('cy', (d) => this.yScale(d[1].value))
          .attr('class', 'dot')
          .attr('data-country', (d) => d[0].country)
          .attr('data-x', (d) => d[0].value)
          .attr('data-y', (d) => d[1].value)
          .attr('data-r', (d) => d[2].value)
          .attr('data-color', (d) => this.countryColors[d[0].country])
          .style('fill', (d) => this.countryColors[d[0].country])
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

      /*
      let legend = d3.legendSize()
          .labelDelimiter(" ")
          .shapePadding(60)
          .scale(this.rScale)
          .shape('circle')
          .labelOffset(20)
          .orient('horizontal');
      d3.select(this.$refs.legend).call(legend);
       */
    },
    initBrush() {
      this.brush = d3.brush()
          .extent([[0, 0], [this.svgWidth, this.svgHeight - this.svgPadding.bottom - this.svgPadding.top]])
          .on('end', (e) => this.handleBrushSelect(e));

      d3.select(this.$refs.brush).call(this.brush);
    },
    cycle(i) {
      if (i < 3) {
        return 0
      } else if (i < 6) {
        return 1
      } else if (i < 9) {
        return 2
      }
    },
    selectAllCountries() {
      const dots = d3.select(this.$refs.scatterGroup).selectAll('.dot');
      let countries = [];
      let colors = [];
      dots.filter(function() {
        let dot = d3.select(this);
        countries.push(dot.attr('data-country'));
        colors.push(dot.attr('data-color'))
        return true;
      }).attr("class", "dot brushed");

      for (let i=0; i < countries.length; i++) {
        this.$store.commit('changeSelectedCountry', countries[i]);
      }
    },
    idled() {
      this.idleTimeout = null;
    },
    handleBrushSelect(e) {
      const extent = e.selection; // in pixels
      const dots = d3.select(this.$refs.scatterGroup).selectAll('.dot');

      if (!extent) {
        if (!this.idleTimeout) return this.idleTimeout = setTimeout(this.idled, 350);
        this.$store.commit('cleanSelectedCountries');
        this.scatter();
        dots.attr("class", "dot");
      } else {
        this.$store.commit('cleanSelectedCountries');

        // Filter for brushed area
        let countries = [];
        let colors = [];
        let selectedDots = 0;
        dots.each(function() {
            let dot = d3.select(this);
            let cx = dot.attr('cx');
            let cy = dot.attr('cy');

            if (extent[0][0] <= cx && cx <= extent[1][0]
                && extent[0][1] <= cy && cy <= extent[1][1]) {
              // dot is in selection
              dot.attr("class", "dot brushed");
              countries.push(dot.attr('data-country'));
              colors.push(dot.attr('data-color'));
              selectedDots += 1;
            }
        });

        // check if dots had been selected, so that dots arent randomly deleted if nothing has been brushed.
        if (selectedDots > 0) {
          dots.each(function() {
            let dot = d3.select(this);
            let cx = dot.attr('cx');
            let cy = dot.attr('cy');

            if (!(extent[0][0] <= cx && cx <= extent[1][0]
                && extent[0][1] <= cy && cy <= extent[1][1])) {
              // dot is not in selection
              dot.remove()
            }
          });
        }

        for (let i=0; i < countries.length; i++) {
          this.$store.commit('changeSelectedCountry', countries[i]);
        }
        this.$store.commit('changeHighlighted', '1');

        d3.select(this.$refs.brush).call(this.brush.move, null);
      }
    },
    handleClick(e) {
      const dots = d3.select(this.$refs.scatterGroup).selectAll('.dot');
      if (!(e.target.classList.contains('dot'))) {
        this.$store.commit('cleanSelectedCountries');
        dots.attr("class", "dot");
      }
    },
    updateSelectedCountries() {
      if (this.selectedCountries.length > 0) {
        // show only selected countries if countries are selected
        this.scatter(true);
      } else {
        this.scatter(false);
      }
    },
    handleFeatureSelect() {
      console.log("hello")
    },

  },
  computed: {
    dataByDate: {
      get() {
        return this.$store.getters.dataByDate;
      }
    },
    infectionRateData: {
      get() {
        let feature_values = [];
        this.dataByDate.forEach((d) => {
          feature_values.push({
            country: d.iso_code,
            value: d[this.infectionRateFeature]
          })
        })

        return feature_values;
      }
    },
    countryFeatureData: {
      get() {
        let feature_values = [];
        this.dataByDate.forEach((d) => {
          feature_values.push({
            country: d.iso_code,
            value: d[this.selectedCountryFeature]
          })
        });

        return feature_values;
      }
    },
    xFeatureData: {
      get() {
        let feature_values = [];
        this.dataByDate.forEach((d) => {
          feature_values.push({
            country: d.iso_code,
            value: d[this.selectedXFeature]
          })
        });

        return feature_values;
      }
    },
    xFeatures: {
      get() {
        return this.$store.getters.features.filter((item) => this.allowedXFeatures.indexOf(item) >= 0);
      }
    },
    countryFeatures: {
      get() {
        return this.$store.getters.features.filter((item) => this.allowedCountryFeatures.indexOf(item) >= 0);
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
    selectedDate: {
      get() {
        return this.$store.getters.selectedDate;
      }
    },
    countryColors: {
      get() {
        return this.$store.getters.countryColors;
      }
    },
    countryNameDict: {
      get() {
        return this.$store.getters.countryNameDict;
      }
    },
    countryFeatureMax() {
      return d3.max(this.countryFeatureData, (d) => d.value);
    },
    countryFeatureMin() {
      return d3.min(this.countryFeatureData, (d) => d.value);
    },
    infectionRateMax() {
      return d3.max(this.infectionRateData, (d) => d.value);
    },
    infectionRateMin() {
      return d3.min(this.infectionRateData, (d) => d.value);
    },
    xFeatureMax() {
      return d3.max(this.xFeatureData, (d) => d.value);
    },
    xFeatureMin() {
      return d3.min(this.xFeatureData, (d) => d.value);
    },
    rScale() {
      // use sqrt scale for setting the area rather than the radius proportionally to the data.
      return d3.scaleSqrt()
          //.rangeRound([3, (this.svgWidth - this.svgPadding.left - this.svgPadding.right) / 50])
          .range([3, (this.svgWidth - this.svgPadding.left - this.svgPadding.right) / 30])
          .domain([this.countryFeatureMin > 0 ? 0 : this.countryFeatureMin, this.countryFeatureMax]);
    },
    xScale() {
      return d3.scaleLinear()
          .rangeRound([0, this.svgWidth - this.svgPadding.left - this.svgPadding.right])
          .domain([this.xFeatureMin > 0 ? 0 : this.xFeatureMin, this.xFeatureMax])
          .nice();
    },
    yScale() {
      return d3.scaleLinear()
          .rangeRound([this.svgHeight - this.svgPadding.top - this.svgPadding.bottom, 0])
          .domain([this.infectionRateMin > 0 ? 0 : this.infectionRateMin, this.infectionRateMax])
          .nice();
    },
  },
  watch: {
    selectedDate: {
      handler() {
        this.updateSelectedCountries();
      }
    },
    selectedCountries: {
      handler() {
        this.updateSelectedCountries();
      },
    },
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
