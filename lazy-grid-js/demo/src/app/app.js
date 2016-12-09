(function($) {
	//////// For testing
	var numberOfRow = 1000;
	var numberOfColumn = 1000;
	
	function getMeta(){
		var meta = {};
		meta.colCount = numberOfColumn;
		meta.rowCount = numberOfRow;
		meta.rowList = [];
		meta.columnList = [];
		meta.defaultColumn = {
			index: 0,
			colspan: 1,
			width: 60,
			fixed: false,
			styleNameSet: 'col-class'
		};
		meta.defaultRow = {
			index: 0,
			colspan: 1,
			height: 25,
			fixed: false,
			styleNameSet: 'row-class'
		};
		var i = 0;
		var j = 0;
		
		for( i = 0; i< numberOfColumn; i++ ){
			meta.columnList.push({
				index: 0,
				colspan: 1,
				width: 60,
				fixed: false,
				styleNameSet: 'col-class'
			});
			meta.columnList.push({
				index: 2,
				colspan: 1,
				width: 60,
				fixed: false,
				styleNameSet: 'col-class'
			});
		}
		
		for( i = 0; i< numberOfRow; i++ ){
			meta.rowList.push({
				index: 0,
				rowspan: 1,
				height: 25,
				fixed: false,
				styleNameSet: 'row-class'
			});
			meta.rowList.push({
				index: 2,
				rowspan: 1,
				height: 25,
				fixed: false,
				styleNameSet: 'row-class'
			});
		}
		return meta;
	}
	
	function getData(border){
		var data = [];
		var i = 0;
		var j = 0;
		
		for( i = border[0]; i <= border[2]; i++ ){
			for( j = border[1]; j <= border[3]; j++ ){
				data.push({
					rowIndex: i,
					colIndex: j,
					value: i + ' ' +j,
					styleNameSet: 'cell-class',
					contentType: 'number',
					//contentType: 'date',
					//contentType: 'list',
					editable: true
				});
			}
		}
		return data;
	}
	////////////// */
	
	function log(message){
		if (
			typeof console === "undefined" || 
			typeof console.log === "undefined"
		){
			return;
		}
		console.log('VLazyGrid: ', message);
	}
	
	function LazyGrid(){
		var that = this;
		
		this.element = {};
		this.tableWrapper = {};
		this.data = [];
		this.tableStartColumn = 0;
		this.tableStartRow = 0;
		this.cellTop = 0;
		this.cellBottom = 0;
		this.cellLeft = 0;
		this.cellRight = 0;
		this.cellOffset = 1;
		this.realColumns = [];
		this.realRows = [];
		this.tableIdSalt = Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
		this.isDrawing = true;
		this.needRebuild = true;
		
		this.realTableHeight = 0;
		this.realTableWidth = 0;
		
		this.defaultCellSize = {
			width: 60,
			height: 25
		};
		this.dataForDisplay = [];
		
		// Simple table generate.
		this.init = function(){
			$.each(that.meta.columnList, function(key, item){
				that.realColumns[item.index] = item; 
			});
			$.each(that.meta.rowList, function(key, item){
				that.realRows[item.index] = item; 
			});
			$('<div/>',{
				'id': 'lazyTable-'+that.tableIdSalt+'-wrapper',
				'class': 'lazyTable-wrapper'
			}).appendTo(that.element);
			that.tableWrapper = $('#'+'lazyTable-'+that.tableIdSalt+'-wrapper');
			that.determinateRealTableSize();
			that.determinateDisplayedCellsAndRows();
		};
		
		this.fillTable = function(cellsData){
			$.each(cellsData, function(key, cell){
				var cellId = 'r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt;
				var cellElement = document.getElementById(cellId);
				var cellList = [];
				//if( typeof(cellElement) !== 'undefined' ){
				if( $('#' + cellId).length ){
					if( cellElement.innerText === '' ){
						cellElement.innerText = cell.value;
					} else if( cellElement.textContent === '' ){
						cellElement.textContent = cell.value;
					}
				}
				cellElement.className += ' '+ (typeof(cell.styleNameSet) !== 'undefined'? cell.styleNameSet : '');
				cellElement.className += ' '+ (typeof(that.realColumns[cell.colIndex]) !== 'undefined'? that.realColumns[cell.colIndex].styleNameSet : that.meta.defaultColumn.styleNameSet);
				cellElement.className += ' '+ (typeof(that.realRows[cell.rowIndex]) !== 'undefined'? that.realColumns[cell.rowIndex].styleNameSet : that.meta.defaultRow.styleNameSet);
				/////
				that.data[cell.rowIndex] = typeof(that.data[cell.rowIndex]) === 'undefined'? [] : that.data[cell.rowIndex];
				that.data[cell.rowIndex][cell.colIndex] = cell;
				$('#'+cellId).qtip({
					content: cell.value,
					position: {
						my: 'top center',
						at: 'bottom center'
					}
				});
				cellElement.onclick = function(){
					if( cell.isClicked ){
						return;
					}
					console.log(cell);
					var cellCopy = jQuery.extend({}, cell);
					that.serverClick('onClick', [cellCopy]);
					if(cell.editable){
						that.edit(cell);
					}
				};
			});
			that.hideSpinner();
			that.isDrawing = false;
		};
		
		this.edit = function(cell){
			cell.isClicked = true;
			var cellId = '#r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt;
			switch(cell.contentType){
				case 'text':
					break;
				case 'number':
					$(cellId).html( '<input class="number-cell" value="' + cell.value + '" />' );
					$(cellId).find('.number-cell').focus();
					$(cellId).find('.number-cell').inputmask({
						'alias': 'numeric', 
						'autoGroup': true, 
						'digits': 0, 
						'integerDigits' : 2,
						'digitsOptional': false, 
						'placeholder': '0'
					})
					$(cellId).find('.number-cell').on('blur', function(){
						var value = $(this).val();
						$(cellId).qtip('option', 'content.text', value);
						cell.value = value;
						$(cellId).html(value);
						cell.isClicked = false;
					});
					break;
				case 'date':
					$(cellId).html( '<input class="date-cell" value="' + cell.value + '" />' );
					$.datetimepicker.setLocale('ru');
					$(cellId).find('.date-cell').focus();
					$(cellId).find('.date-cell').datetimepicker({
						timepicker: 	false,
						dayOfWeekStart: 1,
						format:			'd.m.Y'
					});
					$(cellId).find('.date-cell').on('change', function(){
						var value = $(this).val();
						$(cellId).qtip('option', 'content.text', value);
						cell.value = value;
						$(cellId).html(value);
						cell.isClicked = false;
					});
					break;
				case 'list':
					var availableTags = [
						"ActionScript",
						"ActionScriptActionScriptActionScript",
						"AppleScript",
						"Asp",
						"BASIC",
						"C",
						"C++",
						"Clojure",
						"COBOL",
						"ColdFusion",
						"Erlang",
						"Fortran",
						"Groovy",
						"Haskell",
						"Java",
						"JavaScript",
						"Lisp",
						"Perl",
						"PHP",
						"Python",
						"Ruby",
						"Scala",
						"Scheme"
					];
					$(cellId).html( '<input class="list-cell" value="' + cell.value + '" />' );
					$(cellId).find('.list-cell').autocomplete({
						source: availableTags,
						appendTo: '#lazyTable-' + that.tableIdSalt + '-wrapper'
					});
					$(cellId).find('.list-cell').focus();
					$(cellId).find('.list-cell').on('change', function(){
						var value = $(this).val();
						$(cellId).qtip('option', 'content.text', value);
						cell.value = value;
						$(cellId).html(value);
						cell.isClicked = false;
					});
					break;
				default:
					break;
			}
		};
		
		this.displayTable = function(){
			var tableId = 'lazyTable-'+that.tableIdSalt;
			if( !$('#'+tableId).length ){
				$('<div/>',{
					'id': tableId,
					'class': 'lazy-grid-table' 
				}).appendTo(that.tableWrapper);
				$('#'+tableId).css({
					'height': that.realTableHeight,
					'width': that.realTableWidth
				});
			}
			
			var cellRow = 0;
			var cellCol = 0;
			//var time1;
			//var time2;
			var timeSum = 0;
			var offsetTop = 0;
			var offsetLeft = 0;
			var offsetLeftSave = 0;
			var height = 0;
			var tableStr = '';
			
			for( i = 0; i < that.tableCellRange.top; i++ ){
				offsetTop += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			for( i = 0; i < that.tableCellRange.left; i++ ){
				offsetLeft += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			offsetLeftSave = offsetLeft;
			
			for( cellRow = that.tableCellRange.top; cellRow <= that.tableCellRange.bottom; cellRow++ ){
				height = typeof(that.realRows[cellRow]) !== 'undefined'? that.realRows[cellRow].height : that.meta.defaultRow.height;
				for( cellCol = that.tableCellRange.left; cellCol <= that.tableCellRange.right; cellCol++ ){
					var currentRowIndex = cellRow;
					var currentColIndex = cellCol;
					var _oldindex = -1;
					var cells = {
						top: {},
						left: {}
					};
					
					var itemId = 'r'+currentRowIndex+'c'+currentColIndex+'-'+that.tableIdSalt;
					var i = 0;
					if( !$('#'+itemId).length ){
						tableStr += '<div id="'+ itemId +'"' + ' class="'+'cell r'+currentRowIndex+' c'+currentColIndex+'"' + ' data-row="'+currentRowIndex+'"' +
							' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;"></div>';
					}
					offsetLeft += typeof(that.realColumns[cellCol]) !== 'undefined'? that.realColumns[cellCol].width : that.meta.defaultColumn.width;
				}
				offsetLeft = offsetLeftSave;
				offsetTop += typeof(that.realRows[cellRow]) !== 'undefined'? that.realRows[cellRow].height : that.meta.defaultRow.height;  
			}
			document.getElementById(tableId).insertAdjacentHTML('beforeend', tableStr);
			
			$(that.tableWrapper).find('.cell').each(function(key, item){
				var deleteItem;
				var itemCol = $(item).data('col');
				var itemRow = $(item).data('row');
				if( 
					itemRow < that.realTableRange.top || 
					itemRow > that.realTableRange.bottom ||
					itemCol < that.realTableRange.left ||
					itemCol > that.realTableRange.right
				){
					$(item).remove();
				}
			});
			
			var tempData = that.data;
			that.data = [];
			that.data.length = 0;
			for( cellRow = that.realTableRange.top; cellRow <= that.realTableRange.bottom; cellRow++ ){
				for( cellCol = that.realTableRange.left; cellCol <= that.realTableRange.right; cellCol++ ){
					if( typeof(tempData[cellRow]) !== 'undefined' ){
						if( typeof(tempData[cellRow][cellCol]) !== 'undefined' ){
							if( typeof(that.data[cellRow]) !== 'undefined' ){
								that.data[cellRow][cellCol] = tempData[cellRow][cellCol];
							} else {
								that.data[cellRow] = [];
								that.data[cellRow][cellCol] = tempData[cellRow][cellCol];
							}
						}
					}
				}
			}
			
		};
		
		this.determinateRealTableSize = function(){
			var i;
			for( i = 0; i < that.meta.colCount; i++ ){
				that.realTableWidth += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width; 
			}
			for( i = 0; i < that.meta.rowCount; i++ ){
				that.realTableHeight += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height; 
			}
		};
		
		this.determinateDisplayedCellsAndRows = function(){
			var offsetTop = that.tableWrapper.scrollTop();
			var offsetLeft = that.tableWrapper.scrollLeft();
			var tableWidth = that.tableWrapper.width();
			var tableHeight = that.tableWrapper.height();
			
			var tempTop = 0;
			var tempLeft = 0;
			var offsetTopCells = 0;
			var offsetLeftCells = 0;
			
			while( tempLeft < offsetLeft ){
				if( offsetLeftCells <= that.meta.colCount ){
					tempLeft += typeof(that.realColumns[offsetLeftCells]) !== 'undefined'? that.realColumns[offsetLeftCells].width : that.meta.defaultColumn.width; 
					offsetLeftCells++;
				} else {
					tempLeft = offsetLeft;
				}
			}
			
			while( tempTop < offsetTop ){
				if( offsetTopCells <= that.meta.rowCount ){
					tempTop += typeof(that.realRows[offsetTopCells]) !== 'undefined'? that.realRows[offsetTopCells].height : that.meta.defaultRow.height; 
					offsetTopCells++;
				} else {
					tempTop = offsetTop;
				}
			}
			
			that.cellLeft = offsetLeftCells;
			that.cellRight = offsetLeftCells;
			that.cellTop = offsetTopCells;
			that.cellBottom = offsetTopCells;
			
			tempLeft = offsetLeft + tableWidth;
			
			do{
				if( that.cellRight <= that.meta.colCount ){
					tempLeft -= typeof(that.realColumns[that.cellRight]) !== 'undefined'? that.realColumns[that.cellRight].width : that.meta.defaultColumn.width;
					that.cellRight++;
				} else {
					tempLeft = offsetLeft;
				}
			}while( tempLeft > offsetLeft );
			
			tempTop = offsetTop + tableHeight;
			
			do{
				if( that.cellBottom <= that.meta.rowCount ){
					tempTop -= typeof(that.realRows[that.cellBottom]) !== 'undefined'? that.realRows[that.cellBottom].height : that.meta.defaultRow.height;
					that.cellBottom++;
				} else {
					tempTop = offsetTop;
				}
			}while( tempTop > offsetTop );
			
			that.cellLeft -= that.cellOffset;
			that.cellTop -= that.cellOffset;
			that.cellRight += that.cellOffset;
			that.cellBottom += that.cellOffset;
			
			that.cellLeft = that.cellLeft < 0? 0 : that.cellLeft;
			that.cellTop = that.cellTop < 0 ? 0 : that.cellTop;
			that.cellRight = that.cellRight >= that.meta.colCount? (that.meta.colCount-1) : that.cellRight;
			that.cellBottom = that.cellBottom >= that.meta.rowCount? (that.meta.rowCount-1) : that.cellBottom;
			
			////////////
			
			
			var merged = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			that.realTableRange = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			var isLeftOffset = true;
			var isTopOffset = true;
			
			if( typeof( that.previousTableRange ) !== 'undefined' ){
				if( (that.cellTop - that.previousTableRange.top) > 0 ){
					merged.top = that.previousTableRange.bottom < offsetTopCells ? merged.top : that.previousTableRange.bottom ;
				} else if( (that.cellTop - that.previousTableRange.top) < 0 ){
					merged.bottom = that.previousTableRange.top < offsetTopCells ? merged.bottom : that.previousTableRange.top;
				} else {
					isLeftOffset = false;
				}
				
				if( (that.cellLeft - that.previousTableRange.left) > 0 ){
					merged.left = that.previousTableRange.right < offsetLeftCells ? merged.left : that.previousTableRange.right;
				} else if( (that.cellLeft - that.previousTableRange.left) < 0 ){
					merged.right = that.previousTableRange.left < offsetLeftCells ? merged.right : that.previousTableRange.left ;
				} else {
					isTopOffset = false;
				}
			} else {
				merged = {
					left: that.cellLeft,
					top: that.cellTop,
					right: that.cellRight,
					bottom: that.cellBottom
				};
			}
			
			that.needRebuild = isTopOffset || isLeftOffset;
			
			that.previousTableRange = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			that.tableCellRange = merged;
		};
		
		this.createSpinner = function(){
			$('<div class="spinner" id="spinner-' + that.tableIdSalt + '"></div>').appendTo(that.element);
		};
		
		this.animateSpinner = function(){
			$('#spinner-' + that.tableIdSalt).animate({
				'left' : '-100%'
			}, 7000, 'swing',function(){
				$('#spinner-' + that.tableIdSalt).css('left', '0');
				that.animateSpinner();
			});
		};
		
		this.hideSpinner = function(){
			$('#spinner-' + that.tableIdSalt).hide();
			$('#spinner-' + that.tableIdSalt).stop();
		};
		
		this.showSpinner = function(){
			$('#spinner-' + that.tableIdSalt).show();
			that.animateSpinner();
		};
	}
	
	$.fn.lazyGrid = function( data ) {
		var lazyGrid = new LazyGrid();
		var that = this;
		
		lazyGrid.element = this;
		lazyGrid.meta = data.meta;
		
		if( data.reload ){
			$(lazyGrid.element).html('');
		}
		
		lazyGrid.init();
		lazyGrid.createSpinner();
		lazyGrid.showSpinner();
		lazyGrid.displayTable();
		
		lazyGrid.serverClick = function(eventType, cellList){
			if( typeof data.event === 'function' ){
				console.log(cellList);
				data.event.call( that, 
					{
						event: eventType,
						cellList: cellList
					}
				);
			} else {
				lazyGrid.click = function(cellList){};
			}	
		};
		
		
		if( typeof data.build === 'function' ){
			data.build.call( that, lazyGrid, [
				lazyGrid.tableCellRange.top,
				lazyGrid.tableCellRange.left,
				lazyGrid.tableCellRange.bottom,
				lazyGrid.tableCellRange.right
			]);
		} else {
			lazyGrid.hideSpinner();
			lazyGrid.isDrawing = false;
		}
		
		var timer;
		
		var time1;
		var time2;
		
		lazyGrid.tableWrapper.on('scroll', function(e){
			if( lazyGrid.isDrawing ){
				e.preventDefault();
				return;
			}
			lazyGrid.showSpinner();
			clearTimeout(timer);
			timer = setTimeout(function() {
				time1 = new Date();
				lazyGrid.determinateDisplayedCellsAndRows();
				lazyGrid.displayTable();
				
				if( typeof data.build === 'function' && lazyGrid.needRebuild ){
					data.build.call( that, lazyGrid, [
						lazyGrid.tableCellRange.top,
						lazyGrid.tableCellRange.left,
						lazyGrid.tableCellRange.bottom,
						lazyGrid.tableCellRange.right
					]);
				}else {
					lazyGrid.hideSpinner();
					lazyGrid.isDrawing = false;
				}
				time2 = new Date();
				log(time2.getTime() - time1.getTime());
			}, 10);
		});
	};
	
	$(document).ready(function() {
		var meta = getMeta();
		
		console.log({
			meta: meta,
			build: function( lazyGrid, tableCellRangeList ){
				var data = getData(tableCellRangeList);
				lazyGrid.fillTable(data);
			},
			event: function(tableCellEvent){
				console.log(tableCellEvent);
			}
		});
		
		$('.lazy-grid').lazyGrid({
			meta: meta,
			build: function( lazyGrid, tableCellRangeList ){
				var data = getData(tableCellRangeList);
				lazyGrid.fillTable(data);
			},
			event: function(tableCellEvent){
				console.log(tableCellEvent);
			}
		});
	});
	//// */
})(jQuery);