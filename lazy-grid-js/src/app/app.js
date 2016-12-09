(function($) {
	//////// For testing
	/*var numberOfRow = 1000;
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
		
		for( i = border[0].top; i <= border[0].bottom; i++ ){
			for( j = border[0].left; j <= border[0].right; j++ ){
				data.push({
					rowIndex: i,
					colIndex: j,
					//value: (Math.floor(Math.random() * (100000 - 1 + 1)) + 1),//i + ' ' +j,
					value: ''+(Math.floor(Math.random() * (1414792800000 - 86400*7+1000 + 1)) + 86400*7+1000),styleNameSet: 'cell-class',
					//contentType: {
					//	typeName: 'LG_CELL_CONTENT_NUMBER',
					//	typeParams: {
					//		inputMask: '#####'
					//	} 
					//}, 
					contentType: {
						typeName: 'LG_CELL_CONTENT_DATE'
					},
					//contentType: {
					//	typeName: 'LG_CELL_CONTENT_LIST'
					//},
					//contentType: {
					//	typeName: 'LG_CELL_CONTENT_LABEL'
					//},
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
			var time11 = {};
			var time12 = {};
			var timeSum1 = 0;
			var timeSum2 = 0;
			var timeSum3 = 0;
			var time1 = new Date();
			var timer;
			$.each(cellsData, function(key, cell){
				if( cell.contentType.typeName === 'LG_CELL_CONTENT_DATE' ){
					var date = new Date(parseInt(cell.value));
					cell.value = date.getDate()+'.'+(date.getMonth()+1)+'.'+date.getFullYear();
				}
				var cellId = 'r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt;
				var cellElement = document.getElementById(cellId);
				var cellList = [];
				if( $('#' + cellId).length ){
					time11 = new Date();
					if( cellElement.innerText === '' ){
						cellElement.innerText = cell.value;
					} else if( cellElement.textContent === '' ){
						cellElement.textContent = cell.value;
					}
					cellElement.className += ' '+ (typeof(cell.styleNameSet) !== 'undefined'? cell.styleNameSet : '');
					cellElement.className += ' '+ (typeof(that.realColumns[cell.colIndex]) !== 'undefined'? that.realColumns[cell.colIndex].styleNameSet : that.meta.defaultColumn.styleNameSet);
					cellElement.className += ' '+ (typeof(that.realRows[cell.rowIndex]) !== 'undefined'? that.realColumns[cell.rowIndex].styleNameSet : that.meta.defaultRow.styleNameSet);
					/////
					that.data[cell.rowIndex] = typeof(that.data[cell.rowIndex]) === 'undefined'? [] : that.data[cell.rowIndex];
					that.data[cell.rowIndex][cell.colIndex] = cell;
					time12 = new Date();
					timeSum1 += time12.getTime() - time11.getTime();
					/*time11 = new Date();			
					$('#'+cellId).qtip({
						content: cell.value,
						position: {
							my: 'top center',
							at: 'bottom center'
						}
					});
					time12 = new Date();
					timeSum2 += time12.getTime() - time11.getTime();*/
					/*$('#'+cellId).hover(function(){
						clearTimeout(timer);
						cellElement = $('#'+cellId);
						timer = setTimeout(function(){
							$('<div/>',{
								'id': 'lazyTable-'+that.tableIdSalt+'-tooltip',
								'class': 'lazyTable-tooltip',
								'css': {
									'top': cellElement.position().top+cellElement.height(),
									'left': cellElement.position().left
								},
								'text': cell.value
							}).appendTo('#'+'lazyTable-'+that.tableIdSalt);
						}, 200);
					}, function(){
						clearTimeout(timer);
						$('#'+'lazyTable-'+that.tableIdSalt+'-tooltip').remove();
					})*/
					time11 = new Date();
					cellElement.onclick = function(){
						if( cell.isClicked ){
							return;
						}
						var cellCopy = jQuery.extend({}, cell);
						that.serverClick('onClick', [cellCopy]);
						if(cell.editable){
							that.edit(cell);
						}
					};
					time12 = new Date();
					timeSum3 += time12.getTime() - time11.getTime();
				}
			});
			
			/*document.getElementById('lazyTable-'+that.tableIdSalt).onmousemove = function(e){
				if( $('lazyTable-'+that.tableIdSalt+'-tooltip').length ){
					return;
				}
				$('.lazyTable-tooltip').remove();
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				cellElement = $(elementMouseIsOver);
				clearTimeout(timer);
				timer = setTimeout(function(){
					$('<div/>',{
						'id': 'lazyTable-'+that.tableIdSalt+'-tooltip',
						'class': 'lazyTable-tooltip',
						'css': {
							'top': cellElement.position().top+cellElement.height(),
							'left': cellElement.position().left
						},
						'text': cellElement.text()
					}).appendTo('#'+'lazyTable-'+that.tableIdSalt);
				}, 200);
			};
			
			document.getElementById('lazyTable-'+that.tableIdSalt).onmouseleave = function(e){
				clearTimeout(timer);
				$('.lazyTable-tooltip').remove();
			};*/
			
			/*$(that.tableWrapper).find('.lazy-grid-table').hover(function(e){
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				console.log(elementMouseIsOver);
				cellElement = $(elementMouseIsOver);
				clearTimeout(timer);
				timer = setTimeout(function(){
					console.log('create');
					$('<div/>',{
						'id': 'lazyTable-'+that.tableIdSalt+'-tooltip',
						'class': 'lazyTable-tooltip',
						'css': {
							'top': cellElement.position().top+cellElement.height(),
							'left': cellElement.position().left
						},
						'text': cellElement.text()
					}).appendTo('#'+'lazyTable-'+that.tableIdSalt);
				}, 200);
			}, function(){
				console.log('delete');
				clearTimeout(timer);
				$('#'+'lazyTable-'+that.tableIdSalt+'-tooltip').remove();
			});*/
			var time2 = new Date();
			console.log('fuck', timeSum1);
			console.log('wtf', timeSum2);
			console.log('lol', timeSum3);
			console.log('fill time', time2.getTime() - time1.getTime());
			that.hideSpinner();
			that.isDrawing = false;
		};
		
		this.edit = function(cell){
			var element;
			cell.isClicked = true;
			var cellId = '#r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt;
			var contentTypeName = cell.contentType.typeName;
			switch(contentTypeName){
				case 'LG_CELL_CONTENT_LABEL':
					break;
				case 'LG_CELL_CONTENT_NUMBER':
					$(cellId).html( '<input class="number-cell" value="' + cell.value + '" />' );
					element = $(cellId).find('.number-cell')
					element.focus();
					var digits = cell.contentType.typeParams.inputMask.split('.');
					element.inputmask({
						'alias': 'numeric', 
						'autoGroup': true, 
						'integerDigits': digits[0].length, 
						'digits': (digits[1]||[]).length,
						'digitsOptional': false, 
						'placeholder': '0'
					})
					element.on('blur', function(){
						var value = $(this).val();
						$(cellId).qtip('option', 'content.text', value);
						cell.value = value;
						$(cellId).html(value);
						cell.isClicked = false;
					});
					break;
				case 'LG_CELL_CONTENT_DATE':
					$(cellId).html( '<input class="date-cell" value="' + cell.value + '" />' );
					element =$(cellId).find('.date-cell');
					$.datetimepicker.setLocale('ru');
					element.focus();
					element.datetimepicker({
						timepicker: 	false,
						dayOfWeekStart: 1,
						format:			'd.m.Y',
						startDate:		that.parseDate(cell.value, 'dd.mm.yyyy')
					});
					element.on('change', function(){
						var value = $(this).val();
						$(cellId).qtip('option', 'content.text', value);
						cell.value = value;
						$(cellId).html(value);
						cell.isClicked = false;
					});
					break;
				case 'LG_CELL_CONTENT_LIST':
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
					element = $(cellId).find('.list-cell');
					element.autocomplete({
						source: availableTags,
						appendTo: '#lazyTable-' + that.tableIdSalt + '-wrapper'
					});
					element.focus();
					element.on('change', function(){
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
			//var timeSum = 0;
			var offsetTop = 0;
			var offsetLeft = 0;
			var offsetLeftSave = 0;
			var height = 0;
			var tableStr = '';
			
			var tableElement = document.getElementById(tableId); 
			
			$(that.tableWrapper).find('.cell').each(function(key, item){
				var elem = $(item);
				var deleteItem;
				
				var itemCol = $(item).data('col');
				var itemRow = $(item).data('row');
				if( 
					itemRow < that.realTableRange.top || 
					itemRow > that.realTableRange.bottom ||
					itemCol < that.realTableRange.left ||
					itemCol > that.realTableRange.right
				){
					tableElement.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt));
				}
			});
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
					merged.bottom = that.previousTableRange.top > offsetTopCells ? merged.bottom : that.previousTableRange.top;
				} else {
					isLeftOffset = false;
				}
				
				if( (that.cellLeft - that.previousTableRange.left) > 0 ){
					merged.left = that.previousTableRange.right < offsetLeftCells ? merged.left : that.previousTableRange.right;
				} else if( (that.cellLeft - that.previousTableRange.left) < 0 ){
					merged.right = that.previousTableRange.left > offsetLeftCells ? merged.right : that.previousTableRange.left ;
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
		
		this.parseDate = function(input, format) {
			format = format || 'yyyy-mm-dd'; // default format
			var parts = input.match(/(\d+)/g), 
			i = 0, fmt = {};
			// extract date-part indexes from the format
			format.replace(/(yyyy|dd|mm)/g, function(part) { fmt[part] = i++; });
			return new Date(parts[fmt['yyyy']], parts[fmt['mm']]-1, parts[fmt['dd']]);
		}
		
		this.reloadTable = function(meta){
			$(that.element).html('');
			that.meta = meta;
			that.init();
			that.createSpinner();
			that.showSpinner();
			that.displayTable();
			that.serverClick = function(eventType, cellList){
				if( typeof that.initialData.event === 'function' ){
					that.initialData.event.call( that, 
						{
							event: eventType,
							source: cellList
						}
					);
				} else {
					that.click = function(cellList){};
				}	
			};
			if( typeof that.initialData.build === 'function' ){
				that.initialData.build.call( that, that, [that.tableCellRange]);
			} else {
				that.hideSpinner();
				that.isDrawing = false;
			}
			
			var timer;
			that.tableWrapper.on('scroll', function(e){
				if( that.isDrawing ){
					e.preventDefault();
					return;
				}
				that.showSpinner();
				clearTimeout(timer);
				timer = setTimeout(function() {
					that.determinateDisplayedCellsAndRows();
					that.displayTable();
					if( typeof that.initialData.build === 'function' && that.needRebuild ){
						that.initialData.build.call( that, that, [that.tableCellRange]);
					}else {
						that.hideSpinner();
						that.isDrawing = false;
					}
				}, 100);
			});
		};
	}
	
	$.fn.lazyGrid = function( data ) {
		this.lazyGrid = new LazyGrid();
		var that = this;
		this.lazyGrid.element = this;
		
		this.lazyGrid.initialData = data;
		
		/*this.lazyGrid.meta = data.meta;
		this.lazyGrid.createSpinner();
		this.lazyGrid.showSpinner();
		this.lazyGrid.displayTable();*/
		
		return this;
	};
	
	/*$(document).ready(function() {
		var meta = getMeta();
		
		var plugin = $('.lazy-grid').lazyGrid({
			meta: meta,
			build: function( lazyGrid, tableCellRangeList ){
				var data = getData(tableCellRangeList);
				lazyGrid.fillTable(data);
			},
			event: function(tableCellEvent){
				//var meta = getMeta();
				//lazyGrid.reloadTable(meta);
				//console.log(tableCellEvent);
			}
		});
		
		plugin.lazyGrid.reloadTable(meta);
		
	});
	//// */
})(jQuery);