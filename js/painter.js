$(document).ready(function() {  
  /**
   * Canvas painter
   */
  'use strict';
  var painter = {
    minWidth : 1280,
    mainCanvas : '',
    outlineImageCanvas : '',
    mainContext : '',
    brush: new Object,
    points : [ ],
    buffer : '',
    width : '',
    height : '',
    outlineImage : new Image(),
    isDrawing : false,
    koeff : 1.3,
    init: function(canvas) {  
      this.width = $(window).width(); 
      this.height = $(window).height(); 
      if (this.width < this.minWidth) {
        this.width = this.minWidth;
      }
      var self = this;
      window.onresize = function(event) {
        self.width = $(window).width(); 
        self.height = $(window).height(); 
        if (self.width < self.minWidth) {
          self.width = self.minWidth;
        }
      };

      this.koeff = $('.outline-image-selected')[0].height / $('.outline-image-selected')[0].width || 1.3;
      $('.painter-plot').height($('.painter-plot').width() * this.koeff);

      this.mainCanvas = canvas;
      this.mainContext = this.mainCanvas.getContext('2d');
      this.mainCanvas.width = $('.painter-plot').width();
      this.mainCanvas.height = $('.painter-plot').height();
      this.getbrushOption();
      this.drawOutlineImage();    
    },
    drawOutlineImage: function() {
      var outlineImage = new Image();
      this.outlineImageCanvas = document.getElementById('outline');   
      var context = this.outlineImageCanvas.getContext('2d');
      this.outlineImageCanvas.width = $('.painter-plot').width();
      this.outlineImageCanvas.height = $('.painter-plot').height();
      var self = this; 

      /////////////////////////////////////////////////////////////////////
      // trick for firefox svg height is nulled
      $.get($('.outline-image-selected').attr('src'), function( data ) {
          var xmlSerializer = new XMLSerializer(),
              svgDOM = data;

          var attrs = {
              width: self.outlineImageCanvas.width,
              height: self.outlineImageCanvas.height,
              // viewBox: "0 0 24 24",
              // fill: 'red'
          };
          Object.keys(attrs).forEach(function (key) {
            return svgDOM.documentElement.setAttribute(key, attrs[key]);
          });
          var customSVG = xmlSerializer.serializeToString(svgDOM);
          var blob = new Blob([customSVG], {type: 'image/svg+xml'});
          var url = URL.createObjectURL(blob);
          outlineImage.src = url;
      });

      /////////////////////////////////////////////////////////////////////

      // outlineImage.src = $('.outline-image-selected').attr('src');

      outlineImage.onload = function () {
        context.drawImage(outlineImage, 0, 0, self.outlineImageCanvas.width, self.outlineImageCanvas.height);
      };
      // outlineImage.src = 'images/Uncut.svg';
    },
    getbrushOption: function() {
      this.brush.color = $('.painter-color.is-active').data('color');
      if (this.brush.color !== '#fafafa') {
        this.brush.opacity = $('.group-range [data-opacity]').val()/100;
      } else {
        this.brush.opacity = 1;
      }
      this.brush.colorRGB = this.hexToRgb(this.brush.color);
      this.brush.size = $('.painter-size.is-active').data('size');
      // this.brush.rigidity = $('.group-range [data-rigidity]').val()/100;
      this.setBrushOutput(this.brush);
      this.drawBrushPreview();
    },
    setBrushOutput: function(brush) {
      //$('.group-range [data-size]').siblings('.range-value').text(brush.size);
      if (brush.color !== '#fafafa') {
        $('.group-range [data-opacity]').siblings('.range-value').text(Math.ceil(brush.opacity*100));
      }
      // $('.group-range [data-rigidity]').siblings('.range-value').text(Math.ceil(brush.rigidity*100));
    },
    drawBrushPreview: function() {
      var canvas = document.getElementById('brush-preview');    
      var context = canvas.getContext('2d');    
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.beginPath();
      context.fillStyle = this.getBrushGradient(context,this.brush,50,50);
      context.arc(canvas.width/2, canvas.height/2, this.brush.size/2, 0, 2 * Math.PI);
      context.closePath();
      context.fill();
    },
    hexToRgb: function(color){
        var c;
        if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(color)){
            c= color.substring(1).split('');
            if(c.length== 3){
                c= [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c= '0x'+c.join('');
            return ''+[(c>>16)&255, (c>>8)&255, c&255].join(',');
        }
    },
    getBrushGradient : function(context,brush,x,y){
      var radgrad = context.createRadialGradient(x,y,0,x,y,brush.size/2);
      radgrad.addColorStop(0, 'rgba('+brush.colorRGB+','+brush.opacity+')');
      // radgrad.addColorStop(brush.rigidity, 'rgba('+brush.colorRGB+','+brush.opacity+')');
      radgrad.addColorStop(1, 'rgba('+brush.colorRGB+',0)');
      return radgrad;
    },
    distanceBetween2Points: function ( point1, point2 ) {   
      var dx = point2.x - point1.x;
      var dy = point2.y - point1.y;
      return Math.sqrt( Math.pow( dx, 2 ) + Math.pow( dy, 2 ) );  
    },  
    angleBetween2Points: function ( point1, point2 ) {  
      var dx = point2.x - point1.x;
      var dy = point2.y - point1.y; 
      return Math.atan2( dx, dy );
    },
    writePoints: function(coord){
      this.points.push({ x: coord.x, y: coord.y });
      //first click
      if (this.points.length < 2){
        this.points.push({ x: coord.x, y: coord.y });
      }
    },
    softDraw : function(start,end){
      var distance = parseInt( this.distanceBetween2Points( start, end ) );
      var angle = this.angleBetween2Points( start, end );
      var x,y;
        for ( var z = 0; (z <= distance || z == 0); z++ ){
        x = start.x + (Math.sin(angle) * z);
        y = start.y + (Math.cos(angle) * z);
        var halfBrush = this.brush.size/2;  
        this.mainContext.fillStyle = this.getBrushGradient(this.mainContext,this.brush,x,y);
        this.mainContext.fillRect(
          x-halfBrush,
          y-halfBrush,
          this.brush.size,
          this.brush.size
        );
      }
    },
    draw : function(coord){
      if (!this.isDrawing) {
        return;
      }     

      if (this.width > this.minWidth) {
        coord.x = coord.x - (this.width - this.minWidth)/2 - 215;
      } else {
        coord.x = coord.x - 215;
      }

      coord.y = coord.y - 142;
      this.writePoints(coord);
      var length = this.points.length;
        this.softDraw(this.points[length-2], this.points[length-1]);  
    },
    clear : function(canvas){   
      this.buffer = '';   
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      this.reset();
    },
    saveImg : function(){
        var image = new Image();
        var main = new Image();
        var outlineImage = new Image();
        var text = new Image();
        var logo = new Image();

        var saveImg = document.getElementById("save-image");
        var saveImgCanvas = saveImg.getContext("2d");
        var self = this;

        
        image.crossOrigin="anonymous"
        main.crossOrigin="anonymous"
        outlineImage.crossOrigin="anonymous"
        text.crossOrigin="anonymous"
        logo.crossOrigin="anonymous"

      var downloadImg = {
        width: 2000,
        height: 1424,

        textWidth: 480, 
        textHeight: 300, 
        
        logoWidth: 700, 
        logoHeight: 196, 

        textOffsetY: 130, 
        textOffsetX: 1550, 

        logoOffsetY: 230, 
        logoOffsetX: 1150, 
      };

      downloadImg.height = downloadImg.width * this.koeff;

      saveImg.width = downloadImg.width;
      saveImg.height = downloadImg.height;

      main.onload = function() {
        saveImgCanvas.fillStyle = "#fffafa";
        saveImgCanvas.fillRect(0, 0, downloadImg.width, downloadImg.height);
        saveImgCanvas.drawImage(main, 0, 0, downloadImg.width, downloadImg.height);
          
        outlineImage.onload = function() {
          saveImgCanvas.drawImage(outlineImage, 0, 0, downloadImg.width, downloadImg.height);
          var id = parseInt($('.outline-image-selected').data('id'));

          if ([3, 4, 6, 7, 8].includes(id)) {
            downloadImg.logoOffsetY = 155;
            downloadImg.logoOffsetX = 130;
          } else if (id === 5) {
            downloadImg.logoOffsetY = 1050;
            downloadImg.logoOffsetX = 130;
            downloadImg.textOffsetY = 155;
            downloadImg.textOffsetX = 130;
          }

          text.onload = function() {
              // saveImgCanvas.drawImage(
              //   text, 
              //   downloadImg.textOffsetX, 
              //   downloadImg.textOffsetY, 
              //   downloadImg.textWidth, 
              //   downloadImg.textHeight
              // );
              logo.onload = function() {
                saveImgCanvas.drawImage(
                  logo, 
                  downloadImg.logoOffsetX, 
                  downloadImg.logoOffsetY, 
                  downloadImg.logoWidth, 
                  downloadImg.logoHeight
                );  
                image.src = saveImg.toDataURL("image/png");

                $('.result-image').attr('src', image.src);
              }

              $.get('./img/icons/logon.svg', function( data ) {
                  var xmlSerializer = new XMLSerializer(),
                      svgDOM = data;

                  var attrs = {
                      width: downloadImg.logoWidth, 
                      height: downloadImg.logoHeight,
                      // viewBox: "0 0 24 24",
                      // fill: 'red'
                  };
                  Object.keys(attrs).forEach(function (key) {
                    return svgDOM.documentElement.setAttribute(key, attrs[key]);
                  });
                  var customSVG = xmlSerializer.serializeToString(svgDOM);
                  var blob = new Blob([customSVG], {type: 'image/svg+xml'});
                  var url = URL.createObjectURL(blob);
                  logo.src = url;
              });
              // logo.src = './img/icons/logon.svg';
          }
          text.src = './img/icons/text.svg';
        }
        outlineImage.src = self.outlineImageCanvas.toDataURL("image/png");
        // outlineImage.src = $('.outline-image-selected').attr('src');
      };
      main.src = this.mainCanvas.toDataURL("image/png");
    },
    downloadImg : function(){
      var link = document.createElement("a");
      var href = $('.result-image').attr('src');
      // href = href.replace('image/png', 'image/octet-stream');
      link.setAttribute("href", href);
      link.setAttribute("download", "image");
      link.click();
    },
    saveBuffer : function(){
      this.buffer = new Image();
        this.buffer.src = this.mainCanvas.toDataURL("image/png");     
    },
    reset: function(){    
      this.isDrawing = false;
      this.points = []; 
      this.saveBuffer();
    }
  }

  var canvas = document.getElementById('painter');

  $('.next-step').click(function() {
    if ($('.outline-image-selected').length > 0) {
      $('.first-step-select').removeClass('error');
      $('.first-step').addClass('hidden');
      $('.second-step').removeClass('hidden');
      painter.init(canvas);
    } else {
      $('.first-step-select').addClass('error');
    }
  });
  $('.painter-color').on('click', function() {
    $('.painter-color').removeClass('is-active');
    $(this).addClass('is-active');
    var color = $(this).data('color');
    if (color && color != '#fafafa') {
      $('.painter-size span').css({'background-color': color});
    }
    
    painter.getbrushOption();
  });
  $('.painter-size').on('click', function() {
    $('.painter-size').removeClass('is-active');
    $(this).addClass('is-active');
    painter.getbrushOption();
  });

  /*Update rage value on change*/
  $('.group-range [type="range"]').on('change', function(){
    var opacity = $('.group-range [data-opacity]').val()/100;
    $('.painter-size-opacity span').css({'opacity': opacity});
    painter.getbrushOption();
  });
  /*control*/
  $('.painter-action [data-clear]').on('click', function() {    
    painter.clear(canvas);
  });
  $('[data-save]').on('click', function() {   
    painter.saveImg();
  });
  $('[data-download]').on('click', function() {   
    painter.downloadImg();
  });

  function cursor() {
    var mouseX = 0, mouseY = 0;
    var limitX = $('#painter-wrap').width(), limitY = $('#painter-wrap').height()
    var offset = $('#painter-wrap').offset();
    mouseX = Math.min(event.pageX - offset.left, limitX);
    mouseY = Math.min(event.pageY - offset.top, limitY);
    if (mouseX < 0) mouseX = 0;
    if (mouseY < 0) mouseY = 0;

    var follower = $(".painter-cursor");
    var xp = 0, yp = 0;
    var color = $('.painter-color.is-active').data('color');
    var size = $('.painter-size.is-active').data('size');
    var opacity = $('.group-range [data-opacity]').val()/100;
    if (color == '#fafafa') {
      opacity = 1;  
    }
    color = 'rgba(' + painter.hexToRgb(color) + ', ' + opacity + ')';
    xp += (mouseX - xp) - size/2;
    yp += (mouseY - yp) - size/2;
    follower.css({ 
      'left': xp, 
      'top': yp, 
      'width': size, 
      'height': size,
      'background-color': color
    }); 
  }
  /*Drawing*/
  var painterWrap = document.getElementById('painter-wrap');
  $('#painter-wrap').on('mousemove', function() {
    cursor();
    painter.draw({'x': event.pageX, 'y': event.pageY}); 
  });
    painterWrap.addEventListener('touchmove', function(event) {            
        painter.draw({'x': event.touches[0].pageX, 'y': event.touches[0].pageY}); 
    }, false);
  $('#painter-wrap').on('mousedown', function() {
    painter.isDrawing = true;       
    painter.draw({'x': event.pageX, 'y': event.pageY});       
  });  
    painterWrap.addEventListener('touchstart', function (event) {
    painter.isDrawing = true;             
    painter.draw({x: event.touches[0].pageX, y: event.touches[0].pageY});         
    }, false);
  $(window).on('mouseup touchend', function() {
    if (painter.mainCanvas != '') {
      painter.reset();
    }
    if (window.getSelection) {
        window.getSelection().removeAllRanges();
      } else { // старый IE
        document.selection.empty();
      }
  }); 


});