import { Component, OnInit, OnChanges, DoCheck } from '@angular/core';
import { Chart } from 'node_modules/chart.js';
import { FormsModule } from '@angular/forms'
import { ViewEncapsulation } from '@angular/core';
import { TouchSequence } from '../../../../node_modules/@types/selenium-webdriver';
import { WebapiService } from '../../services/webapi.service';
import { User } from '../../class/user';
import { UserService } from '../../services/user.service';
import { OrganizationService } from '../../services/organization.service';
import { BandwidthService } from '../../services/bandwidth.service';
import { Bandwidth } from '../../class/bandwidth';
import { Router } from '../../../../node_modules/@angular/router';

@Component({
  selector: 'app-bandwidth',
  templateUrl: './bandwidth.component.html',
  styleUrls: ['./bandwidth.component.css'],


})
export class BandwidthComponent implements OnInit, OnChanges {


  private bandwidth: string;
  private data: string;
  private setLow: boolean;
  private setMedium: boolean;
  private setHigh: boolean
  private true = true
  public chart: any;
  private dataset: any
  private settings = false;
  private lowFrom = 0;
  private lowTo = 40;
  private mediumFrom = 41;
  private mediumTo = 80;
  private highFrom = 81;
  private highTo = 100
  private lowThreshold = 40;
  private mediumThreshold = 80;
  private highTreshold = 100;
  private error: boolean = false;
  private errorMessage: string;
  private input = 79;
  private webApi: WebapiService;
  private currentUser: User;
  private userService: UserService;
  private bandwidthService: BandwidthService;
  private dataLoading: Boolean = false;
  private bandwidthValue: String = "Loading . . ." ; 
  private bandwidthStatus: String = "Loading . . .";
  private bwData:Array<Bandwidth> = new Array<Bandwidth>();
  private mostRecent:Bandwidth;
  private overviewTime:Date;
  private overviewUsage:string; 
  private overviewStatus:string;
  private lowTrue:Boolean;
  private mediumTrue:Boolean;
  private highTrue:Boolean;
  private veryhighTrue:Boolean;
  private router:Router;

  constructor(webapi: WebapiService, userService: UserService , bandwidthService:BandwidthService , router:Router) {
    this.webApi = webapi;
    this.userService = userService;
    this.bandwidthService = bandwidthService;
    this.router = router;

  }

  getDataThatHasBeenProcessed(bwData:Array<Bandwidth>)
  {
    var returnData:Array<Bandwidth> = new Array<Bandwidth>();
    bwData.forEach(data => {
      if(data.$riskScore.toLowerCase() == "high" || data.$riskScore.toLowerCase() == "very high"|| data.$riskScore.toLowerCase() == "medium" || data.$riskScore.toLowerCase() == "low")
      {
        if(data.$processed == true)
        {
          returnData.push(data)
        }
      }
    })
    return returnData;
  }
  async ngOnInit() {
    this.webApi.user.subscribe(data => {
      if(data == null)
      {
        this.router.navigate(['/'])
      }
      else{
        this.currentUser = data;
        this.bandwidthService.getBandwidthBasedOnId(this.currentUser.$organizationId).valueChanges().subscribe(data => {
          this.bwData = [];
          data.forEach(bwDataInd => {
            console.log(bwDataInd)
            var currentbw:Bandwidth= this.bandwidthService.convertBandwidth(bwDataInd);
            this.bwData.push(currentbw)
          })
        this.bwData = this.getDataThatHasBeenProcessed(this.bwData);
        this.mostRecent = this.bwData[this.bwData.length - 1];
        this.overviewUsage = this.mostRecent.$usage;
        this.overviewStatus = this.mostRecent.$riskScore
        this.setColour(this.overviewStatus)
           this.chart = this.createChart(this.bwData);
        });
      }
    });
  }

  createChart(bwData:Array<Bandwidth>){
    var dataSet:Array<Number> = new Array<Number>();
    var information:Map<string , any> = this.getUsageData(bwData);
    if(this.chart == null)
    {
      this.chart = new Chart("bandwidthChartV2" , {
        type: 'line',
      })
      var dateArray:Array<string> = new Array<string>();
      var timeMap = information.get("Time")
      timeMap.forEach(element => {
        var date = element.get("Date")
        dateArray.push(date);
      });
      this.chart.data.labels = dateArray
      this.chart.data.datasets = [{label:'Bandwidth Utilization' , data:information.get("usage") , backgroundColor:"#1a1a1a" , pointBackgroundColor: information.get("PointColor")}]
      this.chart.update();
    }
        else {
      //update chart
    }
  }

  getUsageData(bwData:Array<Bandwidth>)
  {
    var dataMap:Map<string, any> = new Map<string, any>(); 
    var usageArray:Array<string> = new Array<string>();
    var riskScore:Array<string> = new Array<string>();
    var time:Array<Map<string,any>> = new Array<Map<string,any>>();
    var backgroundColor: Array<string> = new Array<string>();
    bwData.forEach(data => {
      usageArray.push(data.$usage)
      riskScore.push(data.$riskScore);
      var day = this.getDayFromDate(data.$time)
      var date = data.$time.getDay(); 
      var month = data.$time.getMonth();
      var year = data.$time.getFullYear();
      var hour = data.$time.getHours();
      var t = data.$time.getMinutes();
      var timeMap:Map<string, string> = new Map<string, string>(); 
      timeMap.set("Day" , day);
      timeMap.set("Date" , day + "/" + month + "/" + year);
      timeMap.set("Month" , month.toString());
      timeMap.set("Year" , year.toString());
      timeMap.set("Time" , hour.toString() + ":" +  t.toString())
      timeMap.set("Hour" , hour.toString());
      timeMap.set("Min" , t.toString())
      time.push(timeMap)
      var color = this.getPointColorBasedOnStatus(data.$riskScore);
      backgroundColor.push(color);
    });
    dataMap.set("usage" , usageArray)
    dataMap.set("risk" , riskScore)
    dataMap.set("Time" , time)
    dataMap.set("PointColor" , backgroundColor)
    return dataMap;
  }

  getPointColorBasedOnStatus(riskScore)
  {
    if(riskScore.toLowerCase() == "low")
    {
      return "#4EBB7E"
    }
    else if(riskScore.toLowerCase() == "medium")
    {
      return "#FF8400"
    }

    else if(riskScore.toLowerCase() == "high")
    {
      return "#ff9eb5"

    }
    else {
      return "#D44343"
    }

  }

  getDayFromDate(time:Date)
  {
    var day = time.getDay();
    if(day == 0)
    {
      return "Mon"
    }
    else if(day == 1)
    {
      return "Tue"
    }
    else if(day == 2)
    {
      return "Wed"
    }
    else if(day == 3)
    {
      return "Thur"
    }
    else if(day == 4)
    {
      return "Fri"
    }
    else if(day ==5)
    {
      return "Sat"
    }
    else if(day == 6)
    {
      return "Sun"
    }
  }
    
    // if (this.currentUser == null) {
    //   var allUser: Array<User> = new Array<User>();
    //   this.userService.getUsers().subscribe(data => {
    //     for (var i = 0; i < data.length; i++) {
    //       var newUser = this.userService.convertUser(data[i]);
    //       allUser.push(newUser)
    //     }
    //   });
    //   var returnValue;
    //   this.userService.getUserDocumentID().subscribe(data => {
    //     for (var i = 0; i < data.length; i++) {
    //       if (data[i].payload.doc.id == "KJfWYi34fjRBxl1wDMru") {
    //         returnValue = allUser[i];
    //         returnValue.$documentID = data[i].payload.doc.id
    //         this.currentUser = returnValue;
    //         console.log(this.currentUser)
    //       }
    //     }
    //   });
      
    // }
    // console.log(this.currentUser);

  

    
    
    // console.log(this.currentUser.$organizationId)
    
    //readFromDatabase


    // if(this.currentUser == null)
    // {
    //   this.userService.getUserById("testing2").subscribe( i => {
    //    console.log
    // })


    // if(this.currentUser != null)
    // {

    //   var currentSetting = this.currentUser.$bandwidthSetting;
    //   if(currentSetting == "string")
    //   {
    //     console.log("testing");
    //     this.currentUser.$bandwidthSetting =  this.lowFrom + "," + this.lowTo + "," + this.mediumFrom + "," + this.mediumTo + "," + this.highFrom + "," + this.highTo
    //     console.log("testing");

    //   }
    //   else {
    //       var currentSetArray = currentSetting.split(",")
    //       this.lowFrom = Number.parseInt(currentSetArray[0])
    //       this.lowTo = Number.parseInt(currentSetArray[1])
    //       this.mediumFrom = Number.parseInt(currentSetArray[2])
    //       this.mediumTo = Number.parseInt(currentSetArray[3])
    //       this.highFrom = Number.parseInt(currentSetArray[4])
    //       this.highTo = Number.parseInt(currentSetArray[5])
    //   }
    //   var currentBw = this.getCurrentBwBasedOnData(this.input);
    //   this.setCurrentBandwidth(currentBw, this.input);
    // }
    // else {
    //   this.currentUser =  await this.webApi.getUser("string1"); 
    //   var currentSetting = this.currentUser.$bandwidthSetting;
    //   if(currentSetting == "string")
    //   {
    //     console.log("testing");
    //     this.currentUser.$bandwidthSetting =  this.lowFrom + "," + this.lowTo + "," + this.mediumFrom + "," + this.mediumTo + "," + this.highFrom + "," + this.highTo
    //     console.log("testing");

    //   }
    //   else {
    //       var currentSetArray = currentSetting.split(",")
    //       this.lowFrom = Number.parseInt(currentSetArray[0])
    //       this.lowTo = Number.parseInt(currentSetArray[1])
    //       this.mediumFrom = Number.parseInt(currentSetArray[2])
    //       this.mediumTo = Number.parseInt(currentSetArray[3])
    //       this.highFrom = Number.parseInt(currentSetArray[4])
    //       this.highTo = Number.parseInt(currentSetArray[5])
    //   }
    //   var currentBw = this.getCurrentBwBasedOnData(this.input);
    //   this.setCurrentBandwidth(currentBw, this.input);
    // }

  ngOnChanges() {
    // var currentBw = this.getCurrentBwBasedOnData(this.input);
    // this.chart = this.updateCurrentBandwidth(currentBw, this.input)
  }
  
  setColour(overviewStatus)
  {
    this.lowTrue = false;
    this.mediumTrue = false;
    this.highTrue = false;

    if(overviewStatus.toLowerCase() == "low")
    {
      this.lowTrue = true;
    }
    if(overviewStatus.toLowerCase() == "medium")
    {
      this.mediumTrue = true;
    } if(overviewStatus.toLowerCase() == "high")
    {
      console.log("does this happen")
      this.highTrue = true;
    }
    if(overviewStatus.toLowerCase() == "very high")
    {
      this.veryhighTrue = true;
    }
  }
  
  getCurrentBwBasedOnData(num: number) {
    if (num <= this.lowTo) {
      return "Low"
    }
    else if (num <= this.mediumTo) {
      return "Medium"
    }
    else if (num <= this.highTo) {
      return "High"
    }
    else {
      return null
    }
  }

//   closeSetting() {
//     this.settings = false;
//   }

//   submitSettings() {

//     var value1 = this.lowTo - this.lowFrom
//     var value2 = this.mediumTo - this.mediumFrom + 1
//     var value3 = this.highTo - this.highFrom + 1
//     var total = value1 + value2 + value3;

//     if (this.lowTo >= 0 && this.lowTo <= 100
//       && this.lowFrom >= 0 && this.lowFrom <= 100
//       && this.mediumTo >= 0 && this.mediumTo <= 100
//       && this.mediumFrom >= 0 && this.mediumFrom <= 100
//       && this.highTo >= 0 && this.highTo <= 100
//       && this.highFrom >= 0 && this.highFrom <= 100
//     ) {
//       if (total == 100) {

//         if (this.lowFrom < this.lowTo && this.lowTo < this.mediumFrom && this.mediumFrom < this.mediumTo && this.mediumTo < this.highFrom && this.highFrom < this.highTo) {
//           this.error = false;
//           this.errorMessage = "";
//           this.lowThreshold = this.lowTo;
//           this.mediumThreshold = this.mediumTo;
//           this.highTreshold - this.highTo;

//           var Setting: Array<any> = new Array<any>();

//           this.currentUser.$bandwidthSetting = this.lowFrom + "," + this.lowTo + "," + this.mediumFrom + "," + this.mediumTo + "," + this.highFrom + "," + this.highTo
//           this.webApi.updateUser(this.currentUser.$userId, this.currentUser);
//           var currentBw = this.getCurrentBwBasedOnData(this.input);
//           this.chart = this.updateCurrentBandwidth(currentBw, this.input);
//           this.settings = false;

//         }
//         else {
//           this.errorMessage = "Values are incorrect"
//           this.error = true;
//         }
//       }
//       else {
//         this.errorMessage = "Values do not add up to 100%"
//         this.error = true;
//       }
//     }
//     else {
//       this.errorMessage = "Values must be within 0 - 100"
//       this.error = true;
//     }


//   }
//   testing() {
//     console.log(this.lowFrom + "-" + this.lowTo);
//     console.log(this.mediumFrom + "-" + this.mediumTo)
//     console.log(this.highFrom + "-" + this.highTo)
//     //this.setSettingChart(this.lowFrom , this.lowTo , this.mediumFrom , this.mediumTo , this.highFrom , this.highTo);


//   }

//   getSettingData(lowStart, lowEnd, mediumStart, mediumEnd, highStart, highEnd) {
//     var dataList: Array<any> = new Array<any>();
//     var labelList: Array<string> = new Array<string>();
//     var lowData = lowEnd - lowStart;
//     var mediumData = mediumEnd - mediumStart;
//     var highData = highEnd - highStart;


//     dataList.push(lowEnd);
//     labelList.push("Low")
//     dataList.push(mediumEnd);
//     labelList.push("Medium")
//     dataList.push(highEnd);
//     labelList.push("High")

//     return [dataList, labelList]
//   }


//   // setSettingChart(lowStart , lowEnd, mediumStart, mediumEnd, highStart, highEnd)
//   // {
//   //   var data = this.getSettingData(lowStart, lowEnd, mediumStart, mediumEnd, highStart, highEnd);
//   //   if(this.settingChart == null)
//   //   {
//   //     console.log("is this working")
//   //     this.settingChart = new Chart("newChart" , {
//   //       type: 'doughnut',
//   //       data: {
//   //         datasets: [{
//   //           data: data[0],
//   //           backgroundColor:["#4EAB7E","#FF8400" , "#D44343" ]
//   //        }],
//   //        labels: data[1]

//   //       },
//   //       options : {
//   //         responsive: true,
//   //         maintainAspectRatio: true,

//   //       }
//   //     })
//   //   } 
//   //   else {
//   //     this.settingChart.data.datasets = [{
//   //       data: data[0],
//   //       backgroundColor:["#4EAB7E","#FF8400" , "#D44343" ]
//   //    }],
//   //     this.settingChart.data.labels = data[1]
//   //     this.settingChart.update();
//   //   }

//   // }

//   flip() {
//     this.settings = (this.settings == false) ? true : false;
//     console.log(this.settings);
//     console.log(this.chart)
//     if (this.settings == true) {
//       console.log("testing")
//       //this.setSettingChart(this.lowFrom , this.lowTo , this.mediumFrom , this.mediumTo , this.highFrom , this.highTo);
//       //var currentBw = this.getCurrentBwBasedOnData(39);
//       //var currentBw = "Low"
//       //var data = 39;
//       //this.setCurrentBandwidth(currentBw ,  data);


//     }
//   }
//   setCurrentBandwidth(bandwidth: string, currentPercentage: number) {
//     this.bandwidth = bandwidth
//     this.data = currentPercentage.toString() + "%"
//     var leftover = 100 - currentPercentage;
//     this.dataset = this.getCurrentDatasetForBandwidth(leftover, currentPercentage)
//     this.chart = this.createChart(this.dataset, bandwidth.toLowerCase())
//   }

//   updateCurrentBandwidth(bandwidth: string, currentPercentage: number) {
//     this.bandwidth = bandwidth
//     this.data = currentPercentage.toString() + "%"
//     var leftover = 100 - currentPercentage;
//     this.dataset = this.getCurrentDatasetForBandwidth(leftover, currentPercentage)
//     console.log(this.dataset)
//     this.chart = this.updateChart(this.dataset, bandwidth.toLowerCase())
//     return this.chart;
//   }
//   getCurrentDatasetForBandwidth(leftover: number, current: number) {
//     var dataset: Array<any> = new Array<any>();
//     dataset.push(current)
//     dataset.push(leftover)
//     return dataset;
//   }

//   createChart(data: any, riskLevel) {
//     var color = ""
//     if (riskLevel.toLowerCase() == "high") {
//       color = "#D44343"
//     }
//     else if (riskLevel.toLowerCase() == "medium") {
//       color = "#FF8400"
//     }
//     else if (riskLevel.toLowerCase() == "low") {
//       color = "#4EAB7E"
//     }

//     var options = this.chartOptions(riskLevel.toLowerCase(), color);

//     console.log("this happens");
//     console.log(this.chart);
//     this.chart = new Chart("bandwidthChart", {
//       type: 'doughnut',
//       data: {
//         datasets: [{
//           data: data,
//           backgroundColor: [color, "#A9A9A9"]
//         }],
//         labels: [
//           'Usage',
//           'Remainder'
//         ]

//       },
//       options: options
//     })
//     return this.chart;


//   }

//   updateChart(data: any, riskLevel) {
//     console.log(data);
//     var color = ""
//     if (riskLevel.toLowerCase() == "high") {
//       color = "#D44343"
//     }
//     else if (riskLevel.toLowerCase() == "medium") {
//       color = "#FF8400"
//     }
//     else if (riskLevel.toLowerCase() == "low") {
//       color = "#4EAB7E"
//     }
//     console.log("does this happens");
//     console.log(this.chart);
//     this.chart.data.datasets = [{ data: data, backgroundColor: [color, "#A9A9A9"] }]
//     this.chart.options = this.chartOptions(riskLevel.toLowerCase(), color);
//     this.chart.update();
//     return this.chart;
//   }


//   chartOptions(riskLevel, color) {
//     var options = {
//       responsive: true,
//       maintainAspectRatio: true,
//       segmentShowStroke: false,
//       legend: {
//         display: false
//       },
//       elements: {
//         center: {
//           text: riskLevel.substring(0, 1).toUpperCase() + riskLevel.substring(1),
//           color: color, //Default black
//           fontStyle: 'Helvetica', //Default Arial
//           sidePadding: 40 //Default 20 (as a percentage)

//         },
//         arc: {
//           borderWidth: 3,
//           borderColor: "#1a1a1a"
//         }
//       },
//       tooltips: {
//         callbacks: {
//           label: function (tooltipItem, chartData) {
//             var currentIndex = tooltipItem.index;
//             var currentData = ""
//             console.log(chartData);
//             chartData.datasets.forEach(element => {
//               currentData = element.data[currentIndex] + "%" + chartData.labels[currentIndex]
//             });
//             return currentData
//           }
//         }
//       }
//     }
//     return options;
//   }
// }



// Chart.pluginService.register({
//   beforeDraw: function (chart) {
//     if (chart.config.options.elements.center) {
//       //Get ctx from string
//       var ctx = chart.chart.ctx;

//       //Get options from the center object in options
//       var centerConfig = chart.config.options.elements.center;
//       var fontStyle = centerConfig.fontStyle || 'Arial';
//       var txt = centerConfig.text;
//       var color = centerConfig.color || '#000';
//       var sidePadding = centerConfig.sidePadding || 20;
//       var sidePaddingCalculated = (sidePadding / 100) * (chart.innerRadius * 2)
//       //Start with a base font of 30px
//       ctx.font = "30px " + fontStyle;

//       //Get the width of the string and also the width of the element minus 10 to give it 5px side padding
//       var stringWidth = ctx.measureText(txt).width;
//       var elementWidth = (chart.innerRadius * 2) - sidePaddingCalculated;

//       // Find out how much the font can grow in width.
//       var widthRatio = elementWidth / stringWidth;
//       var newFontSize = Math.floor(30 * widthRatio);
//       var elementHeight = (chart.innerRadius * 2);

//       // Pick a new font size so it will not be larger than the height of label.
//       var fontSizeToUse = Math.min(newFontSize, elementHeight);

//       //Set font settings to draw it correctly.
//       ctx.textAlign = 'center';
//       ctx.textBaseline = 'middle';
//       var centerX = ((chart.chartArea.left + chart.chartArea.right) / 2);
//       var centerY = ((chart.chartArea.top + chart.chartArea.bottom) / 2);
//       ctx.font = fontSizeToUse + "px " + fontStyle;
//       ctx.fillStyle = color;

//       //Draw text in center
//       ctx.fillText(txt, centerX, centerY);
//     }
//   }

}

