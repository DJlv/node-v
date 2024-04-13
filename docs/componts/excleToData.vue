<!-- 导入并读取Excel 表格数据 -->
<template>
    <div>
      <el-upload class="upload-demo" action="" :on-change="handleChange" :on-remove="handleRemove"
        :on-exceed="handleExceed" :limit="limitUpload"
        accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        :auto-upload="false">
        <!-- 只 能 上 传 xlsx / xls 文 件 -->
        <el-button size="small" type="primary">文件格式转化</el-button>
      </el-upload>
    </div>
  </template>
  
  <script>
  import * as XLSX from 'xlsx';
  
  export default {
    data() {
      return {
        tableData: [],
        limitUpload: 1
  
      };
    },
    methods: {
      handleRemove() { },
      handleExceed() { },
      handleChange(file, fileList) {
        this.fileTemp = file.raw;
        if (this.fileTemp) {
          if ((this.fileTemp.type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            || (this.fileTemp.type == 'application/vnd.ms-excel')) {
            this.handleExcel(this.fileTemp);
          } else {
            this.$message({
              type: 'warning',
              message: '文件格式错误，请删除后重新上传！'
            })
          }
        } else {
          this.$message({
            type: 'warning',
            message: '请上文件！'
          })
        }
      },
      handleExcel(fileTemp) {
        let _this = this;
        this.file = fileTemp;
        var rABS = false; //是否将文件读取为二进制字符串
        var f = this.file;
        var reader = new FileReader();
        FileReader.prototype.readAsBinaryString = function (f) {
          var binary = "";
          var rABS = false; //是否将文件读取为二进制字符串
          var wb; //读取完成的数据
          var outdata;
          var reader = new FileReader();
          reader.onload = function (e) {
            var bytes = new Uint8Array(reader.result);
            var length = bytes.byteLength;
            for (var i = 0; i < length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            if (rABS) {
              wb = XLSX.read(btoa(fixdata(binary)), {
                //手动转化
                type: "base64"
              });
            } else {
              wb = XLSX.read(binary, {
                type: "binary"
              });
            }
            outdata = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{
                                              head: 0,
                                              defval: " "
                                          }); //outdata就是你想要的东西
            console.log('未处理的原始数据如下：');
            console.log(outdata);
            console.log("----------------------------------------------------------------------------------------");
  
            let arr = [];
            arr.push(Object.keys(outdata[0]))
            outdata.map(v => {
              arr.push(Object.values(v))
            });
            this.tableData = arr;
            _this.da = arr;
            _this.dalen = arr.length;
            var json = JSON.stringify(arr)
            console.log(json.replaceAll("[","\n    [").replaceAll("]]","]\n]"));
            return arr;
          };
          reader.readAsArrayBuffer(f);
        };
        if (rABS) {
          reader.readAsArrayBuffer(f);
        } else {
          reader.readAsBinaryString(f);
        }
      }
  
    },
    components: {
  
    },
  };
  </script>
  
  <style>
  .table-container {
    overflow-x: auto;
    white-space: nowrap;
    width: 100%;
    /* 根据需要设置宽度 */
    height: 400px;
  }
  
  table {
    display: inline-block;
    white-space: nowrap;
  }
  </style>