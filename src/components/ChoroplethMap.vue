<template>
  <div class="vis-component" ref="chart">
    <section style="width: 100%; height: 100%;">
      <b-tooltip id="tooltip" ref="tooltip" position="is-bottom">
        <template v-slot:content>
        </template>
      </b-tooltip>

      <svg class="main-svg" ref="mapSvg" width="100%" height="100%">
        <g class="chart-group" ref="mapGroup"></g>
        <g class="legend" ref="legend"></g>
      </svg>
    </section>
    <section>
      <b-field>
        <b-select size="is-small" class="mapControl" placeholder="Choose a feature" v-model="selectedFeature" @input="handleFeatureSelect" required>
          <option v-for="item of features" :value="item" :key="item">{{item.split("_").map(word => word[0].toUpperCase() + word.substring(1)).join(" ")}}</option>
        </b-select>
      </b-field>
    </section>
  </div>
</template>

<script>

import * as d3Base from "d3";
import {legendColor} from "d3-svg-legend";
import topology from '@/assets/world-small-geo.json';

const d3 = Object.assign(d3Base, { legendColor })

const mercator = d3.geoMercator().center([30, 60]).scale(180);

export default {
  name: 'ChoroplethMap',
  props: {
  },
  data() {
    return {
      selectedFeature: 'new_cases_smoothed_per_million',
      allowedFeatures: ['new_cases_smoothed_per_million', 'weekly_hosp_admissions_per_million_smoothed',
      'weekly_icu_admissions', 'new_deaths_smoothed_per_million', 'new_vaccinations_smoothed_per_million'],
      featureColors: {
        'new_cases_smoothed_per_million': d3.schemeReds[9],
        'weekly_hosp_admissions_per_million_smoothed': d3.schemeReds[9],
        'weekly_icu_admissions': d3.schemeReds[9],
        'new_deaths_smoothed_per_million': d3.schemeReds[9],
        'new_vaccinations_smoothed_per_million': d3.schemeBlues[9],
      },
      svgWidth: 500,
      svgHeight: 960,
      svgPadding: {
        top: 20, right: 20, bottom: 20, left: 20,
      },
    }
  },
  mounted() {
    //mercator.scale(this.svgWidth * 0.45 * Math.PI).translate([this.svgWidth / 2, this.svgHeight / 2])
    this.initMap();
    this.handleFeatureSelect();
    this.updateCountryColors();
  },
  methods: {
    initMap() {
      let mapGroup = d3.select(this.$refs.mapGroup);
      const tooltip = d3.select("#tooltip");
      const tooltipcontent = d3.select("#tooltip > .tooltip-content");
      const that = this;

      d3.select(this.$refs.mapSvg).on('click', this.handleClick);
      mapGroup
          .selectAll('path')
          .data(topology.features)
          .enter()
          .append('path')
          .attr('fill', (d, i) => this.countryColors[i])
          //.attr('fill', (d) => this.stateColors[d.properties.name])
          .attr('class', 'country')
          .attr('data-country', (d) => d.properties.iso_a3)
          .attr('id', (d) => d.properties.iso_a3.replaceAll(' ',''))
          .attr('d', d3.geoPath().projection(mercator))
          .style('stroke', 'rgb(110, 110, 110)')
          .style('stroke-width', '0.5')
          .on('click', this.handleCountryClick)
          .on('mouseover', function(e) {
            tooltipcontent.html("<b>" + that.countryNameDict[e.target.dataset.country] + "</b><br>" + e.target.dataset.hover);
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

      let zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', function (e) {
        mapGroup.selectAll('path').attr('transform', e.transform)
      });

      d3.select(this.$refs.mapSvg).call(zoom);
    },
    handleCountryClick(e) {
      const country = d3.select(e.target).attr('data-country');

      if (this.selectedCountries.indexOf(country) < 0) {
        // Country has not been selected
        this.$store.commit('changeHighlighted', '1');
        this.$store.commit('changeSelectedCountry', country);
      }
    },
    updateSelectedCountries() {
      const countries = d3.select(this.$refs.mapGroup).selectAll('path')
      if (this.highlighted === true){
        countries.attr('class', 'country grayed')
      } else {
        countries.attr('class', 'country')
      }
      this.selectedCountries.forEach(country => {
        countries
            .filter(function() {
              let dataCountry = d3.select(this).attr('data-country');
              if (country === dataCountry) {
                return true;
              }
            })
            .attr('class', 'country');
      });
    },
    updateCountryColors() {
      for (let i = 0; i < this.countries.length; i++){
        d3.select("#" + this.countries[i].replaceAll(' ','')).attr('fill', this.countryColors[i]);
      }
    },
    handleClick(e) {
      if (!(e.target.classList.contains('country'))) {
        this.$store.commit('changeHighlighted', '0');
        this.$store.commit('cleanSelectedCountries');
        d3.select(this.$refs.mapGroup).selectAll('path').attr('class', 'country')
        //this.updateSelectedCountries();
      }
    },
    getPositiveThresholds(steps, maxValue) {
      let values = [...Array(steps).keys()].map(i => 0.5*(2**i));
      let scale = Math.ceil(maxValue/values[values.length-1]);

      return values.map(i => i*scale/2);
    },
    handleFeatureSelect() {
      let feature_values = {};
      this.dataByDate.forEach((d) => {
        feature_values[d.iso_code] = d[this.selectedFeature];
      });

      let labels = this.getPositiveThresholds(9, this.dataFeatureMax);
      let colorScale = d3.scaleThreshold()
          .domain(labels)
          .range(this.featureColors[this.selectedFeature])

      this.$store.commit("cleanCountryColors");
      for (const country in feature_values) {
        let feature = feature_values[country];
        feature = feature !== undefined && feature !== "undefined" && feature >= 0 ? feature : "No data";

        let color = feature !== "No data" ? colorScale(feature) : "rgb(238, 238, 238)";
        d3.select("#" + country).attr('fill', color).attr('data-hover', feature);
        this.$store.commit("changeCountryColors", country+color)
      }

      // Legend
      let legendShapeWidth = 45;
      let legendCells = 9;
      let legend = d3.legendColor()
          .shapeWidth(legendShapeWidth)
          .shapeHeight(10)
          .cells(legendCells)
          .labels(labels)
          .labelFormat(d3.format(".2f"))
          .shape("rect")
          .orient("horizontal")
          //.shapePadding(10)
          .scale(colorScale);

      d3.select(this.$refs.legend)
          .attr("transform", "translate(" + (this.$refs.mapSvg.clientWidth - legendShapeWidth*legendCells - 27) + ", " + (this.$refs.mapSvg.clientHeight - 45) + ")")
          .call(legend);
    }
  },
  computed: {
    dataFeatureMax() {
      return d3.max(this.$store.getters.data, (d) => d[this.selectedFeature]);
    },
    dataFeatureMin() {
      return d3.min(this.$store.getters.data, (d) => d[this.selectedFeature]);
    },
    dataByDate: {
      get() {
        return this.$store.getters.dataByDate;
      }
    },
    features: {
      get() {
        return this.$store.getters.features.filter((item) => this.allowedFeatures.indexOf(item) >= 0);
      }
    },
    countryNameDict: {
      get() {
        return this.$store.getters.countryNameDict;
      }
    },
    highlighted: {
      get() {
        return this.$store.getters.highlighted;
      }
    },
    selectedDate: {
      get() {
        return this.$store.getters.selectedDate;
      }
    },
    selectedCountries: {
      get() {
        return this.$store.getters.selectedCountries;
      }
    },
    countries: {
      get() {
        return this.$store.getters.countries;
      }
    },
    countryColors: {
      get() {
        return this.$store.getters.countryColors;
      }
    },
  },
  watch: {
    selectedDate: {
      handler() {
        this.handleFeatureSelect();
      }
    },
    dataByDate: {
      handler() {
        this.handleFeatureSelect();
      },
      deep: true,
    },
    selectedCountries: {
      handler() {
        this.updateSelectedCountries();
      }
    },
  },
}
</script>

<style>
.country.grayed {
  fill: rgb(238, 238, 238) !important;
}
.vis-component {
  width: 100%;
  height: 100%;
}
#tooltip {
  opacity: 0;
  position: absolute;
}
.mapControl {
  position: absolute !important;
  margin: .5em;
}
.legend text {
  font-size: 0.8rem !important;
}
</style>
