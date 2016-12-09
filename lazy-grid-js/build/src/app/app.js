(function($) {
	var lgContextMenu;

	function getInternetExplorerVersion() {
		var rv = -1; // Return value assumes failure.
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ua = navigator.userAgent;
			var re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');
			if (re.exec(ua) != null)
				rv = parseFloat(RegExp.$1);
		}
		return rv;
	}
	
	function createContextMenu(){
		var menuElement = $('<ul class="context-menu"></ul>');
		$('html').append(menuElement);

        var menu = $(menuElement).menu();

        menu.element = menuElement;
        lgContextMenu = menu;
	}

	function initLgContextMenu(){
		var htmlElement = $('html');

        $(htmlElement).on("contextmenu", function (event) {
        	var x = event.clientX, y = event.clientY;

			var elementMouseIsOver = getLgCellElement($(document.elementFromPoint(x, y)));
			if (!elementMouseIsOver.hasClass("cell") && !elementMouseIsOver.hasClass("cell-inner")){
				return true;
			}
			
			var cellElement = elementMouseIsOver;
			var lazyGridElement = cellElement.parents(".lazy-grid");
			var lazyGridThis = lazyGridElement[0].lgInstance.lazyGrid;
			var menu = lgContextMenu; 
			var menuElement = menu.element;
			
			var cell = lazyGridThis.data[cellElement.data('row')][cellElement.data('col')];
			
			if (!cell.contextMenuEnable){
				return true;
			}
			
			menu.css({
			    "top": (y + 10) + "px",
			    "left": (x + 10) + "px",
			    "display": "none",
			});
			
			menuElement.each(function(){
				this.tableCell = cell;
				this.tableCellElement = cellElement;
			});
			
			lazyGridThis.initialData.onLoadCellMenu(cell);
            return false;
        });

        $(document).click(function (e) {
        	$.each($(".lazy-grid"), function(key, lazyGridElement){
    			var lazyGridThis = lazyGridElement.lgInstance.lazyGrid;
    			var menu = lgContextMenu;
    			if (menu.element.has(e.target).length === 0)
    			{
    				menu.hide();
    			}
        	});
   		});
	}
	
	function log(message){
		if (
			typeof console === "undefined" || 
			typeof console.log === "undefined"
		){
			return;
		}
		console.log('VLazyGrid: ', message);
	}
	
	if (!('indexOf' in Array.prototype)) {
		Array.prototype.indexOf= function(find, i /*opt*/) {
			if (i===undefined) i= 0;
			if (i<0) i+= this.length;
			if (i<0) i= 0;
			for (var n= this.length; i<n; i++)
				if (i in this && this[i]===find)
					return i;
			return -1;
		};
	}
	
	function getScrollBarWidth(element) {
	    var $outer = $('<div>').css({
				visibility: 'hidden', 
				width: 100, 
				overflow: 'scroll',
				position: 'absolute',
				top: 0
			}).appendTo(element),
			widthWithScroll = $('<div>').css({
				width: '100%'
			}).appendTo($outer).outerWidth();
	    $outer.remove();
	    return 100 - widthWithScroll;
	}
	
	function LazyGrid(){
		var that = this;
		
		this.element = {};
		this.tableWrapper = {};
		this.data = [];
		this.tableServerCellRange = [];
		
		this.visibleFramePosition = {
			offsetTop: 0,
			offsetLeft: 0,
			tableWidth: 0,
			tableHeight: 0			
		};
		
		this.defferredVisibleFramePosition = {
			offsetTop: 0,
			offsetLeft: 0,
			tableWidth: 0,
			tableHeight: 0			
		};

		this.offsetTopTotal;
		this.offsetLeftTotal;
		this.isDrawing = false;
		this.cellTop = 0;
		this.cellBottom = 0;
		this.cellLeft = 0;
		this.cellRight = 0;
		this.cellOffset = 1;
		this.realColumns = [];
		this.realRows = [];
		this.tableIdSalt = Math.floor(Math.random() * (100000 - 1 + 1)) + 1;
		this.needRebuild = true;
		this.selectArea = {};
		this.selectedCells = [];
		this.selectedCellsHelper = {};
		
		this.tablePositionY = 0;
		this.tablePositionX = 0;
		
		this.realTableHeight = 0;
		this.realTableWidth = 0;
		
		this.focusCurrentCell = false;
		this.stopTab = false;
		this.tabDirection = 'forward';

		this.useActiveCell = false;

		this.canMoveNextEdit = true;
		this.isTabPressed = false;
		
		this.cellsUnions = {};
		this.defferredDraw = false;
		
		this.currentActiveCell = {
			row: -1,
			col: -1
		};

		this.timer = {};
		this.timerServerOnSelect = {};
		this.mousedown = false;
		this.tooltipPosition = '';
		
		this.altPressed = false;
		this.ctrlPressed = false;
		this.shiftPressed = false;
		this.leftMouse = 0;
		this.rightMouse = 2;
		
		this.time1;
		this.time2;
		this.timeTotal;
		this.spinnerAnimation;
		
		this.overlapTop = 0;
		this.overlapLeft = 0;
		
		this.stabbing = 'none';
		this.startCellTabbing = {};
		this.endCellTabbing = {};
		
		this.crutch2 = true;
		this.crutch = false;
		this.clicky;
		
		this.zoom = 1;
		
		this.init = function(){
			$.each(that.meta.columnList, function(key, item){
				that.realColumns[item.index] = item;
			});
			$.each(that.meta.rowList, function(key, item){
				that.realRows[item.index] = item;
			});
			that.determinateRealTableSize();
		};
		
		this.createCellContent = function(cell){
			if( typeof(cell) === 'undefined' ){
				return;
			}
			var cellId = getLgCellId(cell,that);
			if( !$(cellId).length ){
				return;
			}
			
			if( !$(cellId+' .cell-inner, '+cellId+' .cell-filled, '+cellId+' .cell-disabled' ).length ){
				return;
			}
			
			var cellElement = $(cellId).find('.cell-inner')[0];
			var cellList = [];
			
			cell.contentValue = typeof(cell.contentValue) === 'undefined'? '' : cell.contentValue;
			
			
			$(cellElement).html(cell.contentValue);
			$(cellElement).addClass('' + (typeof(cell.styleNameSet) !== 'undefined'? cell.styleNameSet : ''));
			$(cellElement).addClass('' + (typeof(that.realColumns[cell.colIndex]) !== 'undefined'? that.realColumns[cell.colIndex].styleNameSet : that.meta.defaultColumn.styleNameSet));
			$(cellElement).addClass('' + (typeof(that.realRows[cell.rowIndex]) !== 'undefined'? that.realRows[cell.rowIndex].styleNameSet : that.meta.defaultRow.styleNameSet));
			$(cellElement).addClass('cell-filled');
			
			var cellElemenStyle = ' '+ (typeof(cell.style) !== 'undefined'? cell.style : '');
			$(cellElement).attr("style", $(cellElement).attr("style") + "; " + cellElemenStyle);
			that.data[cell.rowIndex] = typeof(that.data[cell.rowIndex]) === 'undefined'? [] : that.data[cell.rowIndex];
			that.data[cell.rowIndex][cell.colIndex] = cell;
			
		};
		
		this.startCellEdit = function(cellElement, e, preventDefault){
			var previousActiveCell = {
				row: that.currentActiveCell.row,
				col: that.currentActiveCell.col
			};
			
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');
			var cell = that.data[rowIndex][colIndex];
			if( !isLgCellEditable(cell)){
				return;
			}
			
			if( preventDefault && e ){
				e = e || window.event;
				e.preventDefault ? e.preventDefault() : (e.returnValue = false);	
			}
			
			var cellCopy = jQuery.extend({}, cell);
			that.serverEvent('onEdit', [cellCopy]);
			
			cellElement.parents('.cell').css({
				'z-index' : 2
			});
			cellElement.css('overflow', 'visible');
			that.currentActiveCell.row = rowIndex;
			that.currentActiveCell.col = colIndex;
			that.deleteStaticSelectedCells();
			that.edit(cell);
		};
		
		this.moveTableToLeftBegin = function(elementHeight){
			delete that.previousTableRange;
			var offsetTop = elementHeight;
			var offsetLeft = -(that.realTableWidth - that.visibleFramePosition.tableWidth);
			$(this.element).trigger('tableMove', [{
				action: 'nextRow', 
				offset: { 
					top: offsetTop,
					left: offsetLeft
				}
			}]);
		};

		this.moveTableToRightEnd = function(elementHeight){
			delete that.previousTableRange;
			var offsetTop = elementHeight;
			var offsetLeft = that.realTableWidth - that.visibleFramePosition.tableWidth;
			$(this.element).trigger('tableMove', [{
				action: 'previousRow', 
				offset: { 
					top: -offsetTop,
					left: offsetLeft
				}
			}]);
		};

		
		this.getCellValue = function(cell){
			return typeof(cell.value) === 'undefined'? '' : cell.value.value;
		};

		this.setCellValue = function(cell, value){
			if (typeof(cell.value) === 'undefined'){
				return;
			}
			cell.value.value = value;
		};
		
		this.edit = function(cell){
			var element;
			var cellId = getLgCellId(cell, that);
			if( !$(cellId).length ){
				return;
			}
			cellId += ' .cell-inner'; 
			var cellInnerElement = $(cellId);
			cellInnerElement.parent().addClass('cell-under-edit');
			var contentTypeName = cell.contentType.editPluginName;
			switch(contentTypeName){
				case 'LG_CELL_CONTENT_LABEL':
					break;
				case 'LG_CELL_CONTENT_NUMBER':
					var styles = cellInnerElement.attr('style');
					cellInnerElement.html( '<input style="'+styles+'" class="cell-edit number-cell" value="' + that.getCellValue(cell) + '" size="100000" />' );
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.number-cell');
					var digits = '###.##'.split('.');
					if (cell.contentType.typeParameters.inputMask){
						digits = cell.contentType.typeParameters.inputMask.split('.');
					}
					element.inputmask({
						'alias': 'numeric', 
						'autoGroup': true, 
						'integerDigits': digits[0].length, 
						'digits': (digits[1]||[]).length,
						'digitsOptional': false, 
						'placeholder': '0'
					});
					element.css({
						'width' : '100%',
						'height' : '100%'
					});
					element.focus().select();
					that.cellSave(element, cellId, cell);
					that.canMoveNextEdit = true;
					break;
				case 'LG_CELL_CONTENT_DATE':
					var styles = cellInnerElement.attr('style');
					cellInnerElement.html( '<input style="'+styles+'" readonly="readonly" class="cell-edit date-cell" value="' + cell.contentValue + '"/>' );
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.date-cell');
					element.css({
						'width' : '100%',
						'height' : '100%'
					});
					that.createCellDatepicker(cellId, cell, element);
					break;
				case 'LG_CELL_CONTENT_LIST':
					if ("popup" === cell.contentType.typeParameters.selectMode){
						cellInnerElement.html( '<div class="cell-edit list-cell"></div>' );
					} else {
						cellInnerElement.html( '<input type="text" class="cell-edit list-cell"></div>' );
					}
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.list-cell');
					
					if (!cell.contentType.typeParameters.itemList){
						that.initialData.onLoadCellData(cell);
						break;
					}
						
					var itemList = [];
					var sItemList = cell.contentType.typeParameters.itemList;
					itemList = jQuery.parseJSON(sItemList);
					that.createCellContentList(cellId, cell, element, itemList);
					break;
				case 'LG_CELL_CONTENT_TEXT':
					var styles = cellInnerElement.attr('style');
					cellInnerElement.html( '<textarea style="'+styles+'" class="cell-edit text-cell" >' + that.getCellValue(cell) + '</textarea>' );
					cellInnerElement.addClass('cell-under-edit');
					element = cellInnerElement.find('.text-cell');
					element.css({
						'width' : '100%',
						'height' : '100%'
					});
					element.focus().select();
					that.cellSave(element, cellId, cell);
					that.canMoveNextEdit = true;
					break;					
				case 'LG_CELL_CONTENT_VOCABULARY':
					cellInnerElement.html( '<div class="cell-edit vocabulary-cell" ></div>' );
					cellInnerElement.addClass('cell-under-edit');
					element = $(cellId).find('.vocabulary-cell');
					
					that.initialData.onLoadCellData(cell);
					that.canMoveNextEdit = true;
					break;
				default:
					break;
			}
		};
		
		this.cellSave = function(element, cellId, cell){
			element.bind('keyup', function (event) {
				switch (event.keyCode) {
					case 27: // Esc
						element.cancel = true;
						element.trigger( "blur" );
						break;
					default:
						break;
				}
			});
			element.on('blur', function(){
				that.onCloseCellEdit(element, cellId, cell);
			});
		};
		
		this.onCloseCellEdit = function(element, cellId, cell){		
//			alert('onCloseCellEdit');
//			alert(element.val());
//			alert(element.originalValue);
//			alert(element.forcedFocus);
			if( element.hasClass('list-cell') ){
				if( $(that.clicky).parent().hasClass('es-list') || $(that.clicky).hasClass('es-list') || $(that.clicky).hasClass('list-cell')){
					return;
				} else {
					element.forcedFocus = false;
				}
			}
			if (element.forcedFocus){
				return;
			}
			var cancel = false;
			if (element.cancel){
				cancel = true;
			}
			if( !cancel ){
				var value = element.originalValue ? element.originalValue : element.val();
				that.setCellValue(cell, value);
			}
			var cellElement = $(cellId);
			cellElement.removeClass('cell-under-edit');
			cellElement.parent().removeClass('cell-under-edit');
			
			cellElement.html(cell.contentValue);
			
			if( !cancel ){
				that.serverEvent('onValueChange', [cell]);
			}
			
			cellElement.parents('.cell').css({
				'z-index':	''
			});
			cellElement.css({
				'overflow': 'hidden'
			});
			if( $('.es-list').length ){
				$('.es-list').remove();
			}
			
			delete element;	
		};
		
		this.createCellDatepicker = function(cellId, cell, cellElement){
			$.datetimepicker.setLocale('ru');
			var startDate = new Date(that.getCellValue(cell));
			cellElement.datetimepicker({
				lazyInit: 		true,
				timepicker: 	false,
				dayOfWeekStart: 1,
				format:				'd.m.Y',
				//value:				startDate,
				startDate:			startDate,
				closeOnDateSelect:	true,
				onSelectDate:		function(ct,$i){
//					alert('onChangeDateTime');
					var val = $i.val();
//					alert(val);
					cellElement.cancel = false;
					this.hide();
					cellElement.forcedFocus = false;
					cellElement.datetimepicker( "destroy" );
					//cellElement.val(that.parseDate(val, 'dd.mm.yyyy').getTime());
					cellElement.originalValue = that.parseDate(val, 'dd.mm.yyyy').getTime();
					that.onCloseCellEdit(cellElement, cellId, cell);
					//cellElement.trigger( "blur" );
					//cellElement.trigger( "blur" );
//					alert('onSelectDate');
//					alert(cellElement.val());
				},
				onChangeDateTime:	function(dp,$input){
/*//					alert('onChangeDateTime');
					var val = $input.val();
//					alert(val);
					cellElement.cancel = false;
					this.hide();
					cellElement.forcedFocus = false;
					cellElement.datetimepicker( "destroy" );
					//cellElement.val(that.parseDate(val, 'dd.mm.yyyy').getTime());
					cellElement.originalValue = that.parseDate(val, 'dd.mm.yyyy').getTime();
					cellElement.trigger( "blur" );*/
				},				
				onShow: function(){
					cellElement.unbind('blur');
					cellElement.forcedFocus = true;
					that.canMoveNextEdit = true;
				},
				onClose: function(){
					cellElement.forcedFocus = false;
					cellElement.datepickerShowed = false;
					cellElement.datetimepicker( "destroy" );
					that.onCloseCellEdit(cellElement, cellId, cell);
				}
			});
			
			
			
//			cellElement.on('change', function(){
//				cellElement.cancel = false;
//				$(this).val(that.parseDate(cellElement.val(), 'dd.mm.yyyy').getTime());
//			});
			cellElement.focus();
			that.cellSave(cellElement, cellId, cell);
		};
		
		this.createCellContentDropdown = function(cellId, cell, cellElement, itemList){
			var cellContainerElement = cellElement.parent();
			cellElement.editableSelect({
				filter: false,
				itemList: itemList,
				effects: 'slide',
				onShow: function () {
					cellElement.forcedFocus = true;
					that.canMoveNextEdit = true;
			    },
			    onHide: function () {
			    	var forcedFocusLocal = cellElement.forcedFocus;
			    	cellElement.forcedFocus = false;
			    	if (forcedFocusLocal){
			    		that.onCloseCellEdit(cellElement, cellId, cell);
			    	}
			    },
				onSelect: function (element) {
					cellElement.focus();
			    }
			});

			cellElement = cellContainerElement.find('.list-cell');
			
			cellElement.forcedFocus = false;
			cellElement.val(that.getCellValue(cell));

			that.cellSave(cellElement, cellId, cell);
			cellElement.focus().select();
			that.canMoveNextEdit = true;
		};

		this.createCellContentPopup = function(cellId, cell, cellElement, cellDataList){
			var tableElementWrapper = $('<div class="vocabulary-table-inner"></div>');
			tableElementWrapper.appendTo(cellElement);
			
			var tableElement = $('<table class="ui-widget ui-widget-content vocabulary-table">');
			tableElement.appendTo(tableElementWrapper);
			
			var selectedRow = -1;
			var keyFieldName = cell.contentType.typeParameters.keyField;
			
			var closeDiablog = function(anotherThat){
				if (cellElement.cancel !== false){
					cellElement.cancel = true;
				}
				that.onCloseCellEdit(cellElement, cellId, cell);
				$(anotherThat).dialog('destroy').remove();
			}
			
			dialog = $(cellElement).dialog({
				autoOpen: true,
				height: 300,
				width: 350,
				modal: true,
				buttons: {
					Ok: function() {
						if (selectedRow < 0){
							cellElement.cancel = true;
						} else {
							cellElement.cancel = false;
						}
						closeDiablog(this);
					},
					Cancel: function() {
						cellElement.cancel = true;
						closeDiablog(this);
					}
				},
				close: function() {
					cellElement.cancel = true;
					closeDiablog(this);
				}
			});
			
			var headerKeyList = [];
			var tableHeaderElement = $('<thead>').appendTo(tableElement);
			
			tRow = $('<tr class="ui-widget-header">');
			tableHeaderElement.append(tRow);
			$.each(cell.contentType.typeParameters, function(key, value) {
				var headerNameMatch = key.match(".headerName$");
				if (!headerNameMatch){
					return;
				}
				var headerNameKey = key.replace(headerNameMatch, "");
				headerKeyList.push(headerNameKey);
				
				tHeader = $('<th>').html(value);
				tRow.append(tHeader);
			});
			
			var tableBodyElement = $('<tbody>').appendTo(tableElement);
			
			$.each(cellDataList, function(n, r) {
				tRow = $('<tr>');
				$.each(headerKeyList, function(key, headerKey){
					tCell = $('<td>').html(r[headerKey]);
					tRow.append(tCell);
				});
				tableBodyElement.append(tRow);
			});
			$(tableBodyElement).selectable({
				filter: 'tr',
				selecting: function(event, ui){
		            if(tableBodyElement.find(".ui-selected, .ui-selecting").length > 1){
		                  $(ui.selecting).removeClass("ui-selecting");
		            }
				},
				stop: function() {
					$( ".ui-selected", this ).each(function() {
						var index = $(this).index();
						selectedRow = index;
						var selectedItem = cellDataList[index];
						var selectedValue = selectedItem[keyFieldName];
						cellElement.val(selectedValue);
					});
				}
			});
		};		
		
		this.createCellContentList = function(cellId, cell, element, itemList){
			if ("popup" === cell.contentType.typeParameters.selectMode){
				that.createCellContentPopup(cellId, cell, element, itemList);
			} else {
				var keyFieldName = cell.contentType.typeParameters.keyField;
				var keyItemList = [];
				$.each(itemList, function(key, listItem){
					keyItemList.push(listItem[keyFieldName]);
				});
				that.createCellContentDropdown(cellId, cell, element, keyItemList);
			}
		};
		
		this.loadCellData = function(cell, cellDataList){
			var cellId = '#r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt+ ' .cell-inner';
			var cellElement = $(cellId).find('.list-cell');
			that.createCellContentList(cellId, cell, cellElement, cellDataList);
		};
		
		this.displayTable = function(){
			var tableId = 'lazyTable-'+that.tableIdSalt;
			if( !$('#'+tableId).length ){
				$(that.tableWrapper).css({
					'height': that.realTableHeight,
					'width': that.realTableWidth
				});
				$('<div/>',{
					'id': tableId,
					'class': 'lazy-grid-table'
				}).appendTo(that.tableWrapper);
				$('#'+tableId).css({
					'height': that.realTableHeight,
					'width': that.realTableWidth
				});
				
				that.selectArea.cellPosition = {};
				that.selectArea.pixelPosition = {};
				that.selectArea.startCell = {
					'row': -1,
					'col': -1
				};
				that.selectArea.lastCell = {
					'row': -1,
					'col': -1
				};
				if( 
					$('#'+tableId).height() !== that.realTableHeight ||
					$('#'+tableId).width() !== that.realTableWidth
				){
					return true;
				}
			}
			
			var cellRow = 0;
			var cellCol = 0;
			var timeSum = 0;
			var offsetTop = 0;
			var offsetTopSave = 0;
			var offsetLeft = 0;
			var offsetLeftSave = 0;
			var height = 0;
			var tableStr = '';
			var tableElement = document.getElementById(tableId);
			var deleteCell = true;
			that.offsetsLeft = [];
			that.offsetsTop = [];
			
			
			var currentRowIndex;
			var currentColIndex;
			var itemId;
			
			var i = 0;
			var j = 0;
			
			$('#lazyTable-'+that.tableIdSalt).find('.cell').each(function(key, item){
				var elem = $(item);
				var deleteItem;
				
				var itemCol = $(item).data('col');
				var itemRow = $(item).data('row');
				if( 
					(
						itemRow < that.realTableRange.top || 
						itemRow > that.realTableRange.bottom ||
						itemCol < that.realTableRange.left ||
						itemCol > that.realTableRange.right
					)
				){
					if( elem.hasClass('cell-union') ){
						deleteCell = true;
						for( j = 0; j < that.cellsUnions.union.length; j++ ){
							i = that.cellsUnions.union[j];
							if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
								if(
									that.meta.cellSpanList[i].left === itemCol &&
									that.meta.cellSpanList[i].top === itemRow
								){
									deleteCell = false;
								}
							}
						}
						if( deleteCell ){
							tableElement.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt));
						}
					} else {
						tableElement.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableIdSalt));
					}
				}
			});
			
			for( i = 0; i < that.tableCellRange.top; i++ ){
				offsetTop += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			
			for( i = 0; i < that.tableCellRange.left; i++ ){
				offsetLeft += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			//////////////
			
			var tempOffsetTop = 0;
			var tempOffsetLeft = 0;
			for( i = 0; i < that.realTableRange.top; i++ ){
				tempOffsetTop += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			
			for( i = 0; i < that.realTableRange.left; i++ ){
				tempOffsetLeft += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			
			////////
			
			for( i = that.realTableRange.top; i <= that.realTableRange.bottom; i++ ){
				that.offsetsTop[i] = tempOffsetTop;
				tempOffsetTop += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			
			
			for( i = that.realTableRange.left; i <= that.realTableRange.right; i++ ){
				that.offsetsLeft[i] = tempOffsetLeft;
				tempOffsetLeft += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			//////
			
			//that.offsetsLeft[that.tableCellRange.left] = offsetLeft;
			
			var diffLeftRight = that.tableCellRange.right - that.tableCellRange.left;
			
			offsetLeftSave = offsetLeft;
			offsetTopSave = offsetTop;
			for( cellRow = that.tableCellRange.top; cellRow <= that.tableCellRange.bottom; cellRow++ ){
				height = typeof(that.realRows[cellRow]) !== 'undefined'? that.realRows[cellRow].height : that.meta.defaultRow.height;
				for( cellCol = that.tableCellRange.left; cellCol <= that.tableCellRange.right; cellCol++ ){
					currentRowIndex = cellRow;
					currentColIndex = cellCol;
					var _oldindex = -1;
					var cells = {
						top: {},
						left: {}
					};
					
					itemId = 'r'+currentRowIndex+'c'+currentColIndex+'-'+that.tableIdSalt;
					i = 0;
					if( !$('#'+itemId).length ){
						tableStr += '<div id="'+ itemId +'"' + ' class="'+'cell r'+currentRowIndex+' c'+currentColIndex+'"' + ' data-row="'+currentRowIndex+'"' +
							' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;">'+
							'<div class="cell-inner" data-row="'+currentRowIndex+'"' +
							' data-col="'+currentColIndex+'"' + 'style="width:'+ (typeof(that.realColumns[currentColIndex]) !== 'undefined'? that.realColumns[currentColIndex].width : that.meta.defaultColumn.width)+'px;height:'+height+'px;"></div>'+
							'</div>';
					}
					offsetLeft += typeof(that.realColumns[cellCol]) !== 'undefined'? that.realColumns[cellCol].width : that.meta.defaultColumn.width;
					//if( that.tableCellRange.top === cellRow ){
						//that.offsetsLeft.push(offsetLeft);
					//}
				}
				offsetLeft = offsetLeftSave;
				offsetTop += typeof(that.realRows[cellRow]) !== 'undefined'? that.realRows[cellRow].height : that.meta.defaultRow.height;
				//that.offsetsTop.push(offsetTop);
			}
			document.getElementById(tableId).insertAdjacentHTML('beforeend', tableStr);
			
			//that.disableMergedUnions();
			that.expandUnionCells();
			
			/*$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell:not(.passive-union-part) .cell-inner:not(.cell-filled)').each(function(key, item){
				var rowIndex = $(item).data('row');
				var colIndex = $(item).data('col');
				if( typeof(that.data[rowIndex]) !== 'undefined' ){
					if( that.data[rowIndex][colIndex] !== 'undefined' ){
						that.createCellContent(that.data[rowIndex][colIndex]);
					}
				}
			});*/
				
			
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
			
			/*if( $(that.element).outerWidth() < $(that.tableWrapper).outerWidth() ){
				var fixedTableWidth = (that.visibleFramePosition.tableWidth+that.visibleFramePosition.offsetLeft) > ($(that.element).outerWidth() - getScrollBarWidth(that.element))? 
					(that.visibleFramePosition.tableWidth - getScrollBarWidth(that.element)) :
					that.visibleFramePosition.tableWidth
				;
			} else {
				var fixedTableWidth = that.visibleFramePosition.tableWidth;
			}
			
			if( $(that.element).outerHeight() < $(that.tableWrapper).outerHeight() ){
				var fixedTableHeight = (that.visibleFramePosition.tableHeight+that.visibleFramePosition.offsetTop) > ($(that.element).outerHeight() - getScrollBarWidth(that.element))? 
					(that.visibleFramePosition.tableHeight - getScrollBarWidth(that.element)) :
					that.visibleFramePosition.tableHeight
				;
			} else {
				var fixedTableHeight = that.visibleFramePosition.tableHeight;
			}*/
			
			/*var ie = getInternetExplorerVersion();
			if( ie >= 8 * ie <= 9 ){
				var tblWidth = that.visibleFramePosition.tableWidth/that.zoom;
				var tblHeight = that.visibleFramePosition.tableHeight/that.zoom;
			} else {*/
				var tblWidth = that.visibleFramePosition.tableWidth;
				var tblHeight = that.visibleFramePosition.tableHeight;
			//}
			
			var fixedTableWidth = (tblWidth+that.visibleFramePosition.offsetLeft) < $(that.tableWrapper).outerWidth() ?
					(tblWidth - getScrollBarWidth(that.element)) :
					tblWidth;
					
			var fixedTableHeight = (tblHeight+that.visibleFramePosition.offsetTop) < $(that.tableWrapper).outerHeight() ?
					(tblHeight - getScrollBarWidth(that.element)) :
					tblHeight;
			
			$(that.element).trigger('fixedCellsEvent', [{
				tableId: 			that.tableIdSalt,
				meta: 				that.meta,
				cellsOffsetLeft:	that.offsetsLeft,
				cellsOffsetTop:		that.offsetsTop,
				cellsUnions:		that.cellsUnions,
				realTableRange: 	that.realTableRange,
				viewportOffsetTop:	that.visibleFramePosition.offsetTop,
				viewportOffsetLeft:	that.visibleFramePosition.offsetLeft,
				tableWidth:			fixedTableWidth,
				tableHeight:		fixedTableHeight,
				//tableCellRange:		that.tableCellRange,
				tableCellRange:		that.realTableRange,
				realTableHeight:	that.realTableHeight,
				realTableWidth:		that.realTableWidth,
				zoom:				that.zoom
			}]);
			
			return false;
		};
		
		this.addServerCellRange = function(additionalTableServerCellRange){
			if( typeof(additionalTableServerCellRange) !== 'undefined' ){
				if(additionalTableServerCellRange.length !== 0){
					that.needRebuild = true;
				}
				that.tableServerCellRange = that.tableServerCellRange.concat(additionalTableServerCellRange);
			}			
		};
		
		this.determinateRealTableSize = function(){
			var i;
			that.realTableWidth = 0;
			that.realTableHeight = 0;
			for( i = 0; i < that.meta.colCount; i++ ){
				that.realTableWidth += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width; 
			}
			for( i = 0; i < that.meta.rowCount; i++ ){
				that.realTableHeight += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height; 
			}
		};
		
		this.determinateDisplayedCellsAndRows = function(){
			var offsetTop = that.offsetTopTotal;
			var offsetLeft = that.offsetLeftTotal;
			var tableWidth = parseInt(that.visibleFramePosition.tableWidth);
			var tableHeight = parseInt(that.visibleFramePosition.tableHeight);
			
			var lgZoomX = parseFloat(getURLParameters('lgZoomX'));
			var lgZoomY = parseFloat(getURLParameters('lgZoomY'));
			lgZoomX = lgZoomX > 0? lgZoomX : 1;
			lgZoomY = lgZoomY > 0? lgZoomY : 1;			
			
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
			that.cellLeft = that.cellLeft < 0? 0 : that.cellLeft;
			that.cellTop = that.cellTop < 0 ? 0 : that.cellTop;
			
			if( typeof(that.realTableRange) !== 'undefined' ){
				that.needRebuild = false;
			
				if( 
					(that.cellLeft - that.realTableRange.left) < 2 &&
					(that.cellLeft - that.realTableRange.left) != 0 &&
					that.realTableRange.left !== 0
				){
					that.needRebuild = true;
				}
				
				if( 
					(that.cellTop - that.realTableRange.top) < 2 &&
					(that.cellTop - that.realTableRange.top) != 0 &&
					that.realTableRange.top !== 0
				){
					that.needRebuild = true;
				}
				
				if( 
					( that.realTableRange.right - that.cellRight) < 2 &&
					( that.realTableRange.right - that.cellRight) != 0 &&
					that.realTableRange.right !== (that.meta.colCount-1)
				){
					that.needRebuild = true;
				}
				
				if( 
					( that.realTableRange.bottom - that.cellBottom) < 2 &&
					( that.realTableRange.bottom - that.cellBottom) != 0 &&
					that.realTableRange.bottom !== (that.meta.rowCount-1)
				){
					that.needRebuild = true;
				}
				
				if( !that.needRebuild ){
					return;
				}
			}
			
			var widthInCell = that.cellRight - that.cellLeft;
			var offsetWidthInCell = lgZoomX*widthInCell - widthInCell;
			that.cellLeft -= parseInt(offsetWidthInCell/2);
			that.cellRight += parseInt(offsetWidthInCell/2);
			
			var heightInCell = that.cellBottom - that.cellTop;
			var offsetHeightInCell = lgZoomY*heightInCell - heightInCell;
			that.cellTop -= parseInt(offsetHeightInCell/2);
			that.cellBottom += parseInt(offsetHeightInCell/2);
			
			that.cellLeft = that.cellLeft < 0? 0 : that.cellLeft;
			that.cellTop = that.cellTop < 0 ? 0 : that.cellTop;
			that.cellRight = that.cellRight >= that.meta.colCount? (that.meta.colCount-1) : that.cellRight;
			that.cellBottom = that.cellBottom >= that.meta.rowCount? (that.meta.rowCount-1) : that.cellBottom;
			
			/*that.cellLeft -= that.cellOffset;
			that.cellTop -= that.cellOffset;
			that.cellRight += that.cellOffset;
			that.cellBottom += that.cellOffset;
			
			that.cellLeft = that.cellLeft < 0? 0 : that.cellLeft;
			that.cellTop = that.cellTop < 0 ? 0 : that.cellTop;
			that.cellRight = that.cellRight >= that.meta.colCount? (that.meta.colCount-1) : that.cellRight;
			that.cellBottom = that.cellBottom >= that.meta.rowCount? (that.meta.rowCount-1) : that.cellBottom;*/
			
			////////////
			
			var cellsWidth = that.cellRight - that.cellLeft;
			var cellsHeight = that.cellBottom - that.cellTop;
			
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
			var isRightOffset = true;
			var isTopOffset = true;
			var isBottomOffset = true;
			
			if( typeof( that.previousTableRange ) !== 'undefined' ){
				if( (that.cellTop - that.previousTableRange.top) > 0 ){
					merged.top = that.previousTableRange.bottom < offsetTopCells ? merged.top : ( that.crutch2? that.previousTableRange.bottom : merged.top );
				} else if( (that.cellTop - that.previousTableRange.top) < 0 ){
					merged.bottom = that.previousTableRange.top > offsetTopCells ? merged.bottom : ( that.crutch2? that.previousTableRange.top : merged.bottom );
				} else {
					isTopOffset = false;
				}
				
				if( (that.cellBottom - that.previousTableRange.bottom) > 0 && that.crutch2 ){
					merged.top = (merged.bottom - cellsHeight) > that.previousTableRange.bottom ? merged.top : that.previousTableRange.bottom;
					if( merged.top === merged.bottom){
						isBottomOffset = false;
					}
				} else if( (that.cellTop - that.previousTableRange.top) < 0 && isTopOffset ){
				} else {
					isBottomOffset = false;
				}
				
				if( (that.cellLeft - that.previousTableRange.left) > 0 ){
					merged.left = that.previousTableRange.right < offsetLeftCells ? merged.left : ( that.crutch2?that.previousTableRange.right : merged.left );
				} else if( (that.cellLeft - that.previousTableRange.left) < 0 ){
					merged.right = that.previousTableRange.left > offsetLeftCells ? merged.right : ( that.crutch2 ? that.previousTableRange.left : merged.right );
				} else {
					isLeftOffset = false;
				}
				
				if( (that.cellRight - that.previousTableRange.right) > 0 && that.crutch2 ){
					merged.left = (merged.right - cellsWidth) > that.previousTableRange.right ? merged.left : that.previousTableRange.right;
					if( merged.left === merged.right){
						isRightOffset = false;
					}
				} else if( (that.cellRight - that.previousTableRange.right) < 0 && isLeftOffset){
				} else {
					isRightOffset = false;
				}
			} else {
				merged = {
					left: that.cellLeft,
					top: that.cellTop,
					right: that.cellRight,
					bottom: that.cellBottom
				};
			}
			
			if(
				(
					that.previousTableRange.left !== that.realTableRange.left &&
					that.previousTableRange.top !== that.realTableRange.top
				) 
				||
				(
					that.previousTableRange.right !== that.realTableRange.right &&
					that.previousTableRange.bottom !== that.realTableRange.bottom
				)

			){
				merged = {
					left: that.cellLeft,
					top: that.cellTop,
					right: that.cellRight,
					bottom: that.cellBottom
				};
			} 
			
			that.needRebuild = isTopOffset || isLeftOffset || isBottomOffset || isRightOffset;
			
			that.previousTableRange = {
				left: that.cellLeft,
				top: that.cellTop,
				right: that.cellRight,
				bottom: that.cellBottom
			};
			
			that.tableCellRange = merged;
			that.tableServerCellRange = [];
			that.tableServerCellRange.length = 0;
			that.tableServerCellRange.push(that.tableCellRange);
			
			that.determinateUnions();
		};
		
		this.addUnionToTableRange = function(){
			var j = 0;
			var i = 0;
			for( j = 0; j < that.cellsUnions.union.length; j++ ){
				i = that.cellsUnions.union[j];
				if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
					if( !$('#r'+that.meta.cellSpanList[i].top+'c'+that.meta.cellSpanList[i].left+'-'+that.tableIdSalt+' .cell-filled').length ){
						that.tableServerCellRange.push({
							left: that.meta.cellSpanList[i].left,
							right: that.meta.cellSpanList[i].left,
							top: that.meta.cellSpanList[i].top,
							bottom: that.meta.cellSpanList[i].top
						});
					}
				}
			}
		};
		
		this.determinateUnions = function(){
			that.cellsUnions.displayedRanges = [];
			for( var i = 0; i < that.meta.cellSpanList.length; i++ ){
				that.cellsUnions.displayedRanges[i] = {
					top: that.meta.cellSpanList[i].top,
					bottom: that.meta.cellSpanList[i].bottom,
					left: that.meta.cellSpanList[i].left,
					right: that.meta.cellSpanList[i].right
				};
				if( that.cellsUnions.displayedRanges[i].left < that.realTableRange.left ){
					that.cellsUnions.displayedRanges[i].left = that.realTableRange.left;
					if( that.cellsUnions.displayedRanges[i].right < that.realTableRange.left){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].right > that.realTableRange.right ){
						that.cellsUnions.displayedRanges[i].right = that.realTableRange.right;
					}
				}
				if( that.cellsUnions.displayedRanges[i].right > that.realTableRange.right ){
					that.cellsUnions.displayedRanges[i].right = that.realTableRange.right;
					if( that.cellsUnions.displayedRanges[i].left > that.realTableRange.right){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].left < that.realTableRange.left ){
						that.cellsUnions.displayedRanges[i].left = that.realTableRange.left;
					}
				}
				if( that.cellsUnions.displayedRanges[i].top < that.realTableRange.top ){
					that.cellsUnions.displayedRanges[i].top = that.realTableRange.top;
					if( that.cellsUnions.displayedRanges[i].bottom < that.realTableRange.top){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].bottom > that.realTableRange.bottom ){
						that.cellsUnions.displayedRanges[i].bottom = that.realTableRange.bottom;
					}
				}
				if( that.cellsUnions.displayedRanges[i].bottom > that.realTableRange.bottom ){
					that.cellsUnions.displayedRanges[i].bottom = that.realTableRange.bottom;
					if( that.cellsUnions.displayedRanges[i].top > that.realTableRange.bottom){
						that.cellsUnions.displayedRanges.splice(i,1);
						continue;
					} else if( that.cellsUnions.displayedRanges[i].top < that.realTableRange.top ){
						that.cellsUnions.displayedRanges[i].top = that.realTableRange.top;
					}
				}
			}
		};
		
		this.determinateMergedUnions = function(){
			that.cellsUnions.merged = [];
			that.cellsUnions.union = [];
			for( i = 0; i < that.meta.cellSpanList.length ; i++ ){
				that.cellsUnions.union.push(i);
			}
		};
		
		this.disableMergedUnions = function(){
			var cellId = '';
			var disabledCells = [];
			for(var j = 0; j < that.cellsUnions.merged.length ; j++){
				var i = that.cellsUnions.merged[j];
				if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
					for( var rowIndex = that.cellsUnions.displayedRanges[i].top; rowIndex <= that.cellsUnions.displayedRanges[i].bottom; rowIndex++ ){
						for( var colIndex = that.cellsUnions.displayedRanges[i].left; colIndex <= that.cellsUnions.displayedRanges[i].right; colIndex++ ){
							cellId = '#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt;
							element = $(cellId).find('.cell-inner');
							element.html('');
							element.removeClass('cell-inner');
							element.addClass('cell-disabled');
							((disabledCells=disabledCells||[])[rowIndex]=disabledCells[rowIndex]||[])[colIndex]=true;
						}
					}
				}
			}
			
			$('#lazyTable-'+that.tableIdSalt+' .cell-disabled').removeClass('cell-disabled-bottom');
			$('#lazyTable-'+that.tableIdSalt+' .cell-disabled').removeClass('cell-disabled-right');
			$.each(disabledCells, function(rowIndex, row){
				$.each(row, function(colIndex, item){
					element = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).find('.cell-disabled');
					if( (disabledCells[parseInt(rowIndex)+1]=disabledCells[parseInt(rowIndex)+1]||{})[parseInt(colIndex)] !== true ) {
						element.addClass('cell-disabled-bottom');
					}
					if( (disabledCells[parseInt(rowIndex)]=disabledCells[parseInt(rowIndex)]||{})[parseInt(colIndex)+1] !== true ) {
						element.addClass('cell-disabled-right');
					}
				});
			});
		};
		
		this.getUnionId = function(fixedRowIndex, fixedColIndex){
			for( var i = 0; i < that.meta.cellSpanList.length; i++ ){
				if( 
					fixedRowIndex >= that.meta.cellSpanList[i].top &&
					fixedRowIndex <= that.meta.cellSpanList[i].bottom && 
					fixedColIndex >= that.meta.cellSpanList[i].left &&
					fixedColIndex <= that.meta.cellSpanList[i].right 
				){
					return i;
				}
			}
			return -1;
		};
		
		this.expandUnionCells = function(){
			var height = 0;
			var width = 0;
			var offsetTop = 0;
			var offsetLeft = 0;
			var cellStr = '';
			var tableId = 'lazyTable-'+that.tableIdSalt;
			
			var rowIndex = 0;
			var colIndex = 0;
			for( var j = 0; j < that.cellsUnions.union.length; j++ ){
				var i = that.cellsUnions.union[j];
				if( typeof(that.cellsUnions.displayedRanges[i]) !== 'undefined' ){
					that.cellsUnions.displayedRanges[i] = {
						top: that.meta.cellSpanList[i].top,
						bottom: that.meta.cellSpanList[i].bottom,
						left: that.meta.cellSpanList[i].left,
						right: that.meta.cellSpanList[i].right
					};
					for( rowIndex = that.cellsUnions.displayedRanges[i].top; rowIndex <= that.cellsUnions.displayedRanges[i].bottom; rowIndex++ ){
						height += typeof(that.realRows[rowIndex]) !== 'undefined'? 
								that.realRows[rowIndex].height : that.meta.defaultRow.height; 
					}
					for( colIndex = that.cellsUnions.displayedRanges[i].left; colIndex <= that.cellsUnions.displayedRanges[i].right; colIndex++ ){
						width += typeof(that.realColumns[colIndex]) !== 'undefined'? 
								that.realColumns[colIndex].width : that.meta.defaultColumn.width; 
					}
					for( rowIndex = that.cellsUnions.displayedRanges[i].top; rowIndex <= that.cellsUnions.displayedRanges[i].bottom; rowIndex++ ){
						for( colIndex = that.cellsUnions.displayedRanges[i].left; colIndex <= that.cellsUnions.displayedRanges[i].right; colIndex++ ){
							element = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
							if( 
								rowIndex === that.cellsUnions.displayedRanges[i].top && 
								colIndex === that.cellsUnions.displayedRanges[i].left 
							){
								if( element.length ){
									if( !element.hasClass('cell-union') ){
										element.addClass('cell-union');
										element.find('.cell-inner').addClass('cell-union');
										element.css('z-index', '4');
										if( !element.data('unionid') ){
											element.data('unionid',i);
											element.find('.cell-inner').data('unionid',i);
										}
									}
								} else {
									for( i2 = 0; i2 < rowIndex; i2++ ){
										offsetTop += typeof(that.realRows[i2]) !== 'undefined'? that.realRows[i2].height : that.meta.defaultRow.height;
									}
									for( i2 = 0; i2 < colIndex; i2++ ){
										offsetLeft += typeof(that.realColumns[i2]) !== 'undefined'? that.realColumns[i2].width : that.meta.defaultColumn.width;
									}
									cellStr = '<div id="r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt +'"' + ' class="cell-union cell r'+rowIndex+' c'+colIndex+'"' + ' data-row="'+rowIndex+'"' +
									' data-col="'+colIndex+'"' + ' data-unionid="' + i + '" style="top:'+offsetTop+'px;left:'+offsetLeft+'px;z-index:4;">'+
								
									'<div class="cell-union cell-inner" data-row="'+rowIndex+'"' +
									' data-col="'+colIndex+'"' + ' data-unionid="' + i + '"></div>'+
									'</div>';
									document.getElementById(tableId).insertAdjacentHTML('beforeend', cellStr);
								}
								
								continue;
							} else {
								element.addClass('passive-union-part');
							}
							if( element.length ){
								if( !element.data('unionid') ){
									element.data('unionid',i);
									element.find('.cell-inner').data('unionid',i);
								}
							}
						}
					}
					$('#r'+that.cellsUnions.displayedRanges[i].top+'c'+that.cellsUnions.displayedRanges[i].left+'-'+that.tableIdSalt).css({
						'height': height,
						'width': width
					});
					$('#r'+that.cellsUnions.displayedRanges[i].top+'c'+that.cellsUnions.displayedRanges[i].left+'-'+that.tableIdSalt+' .cell-inner').css({
						'height': height,
						'width': width
					});
					height = 0;
					width = 0;
				}
				offsetTop = 0;
				offsetLeft = 0;
			}
		};
		
		this.createSpinner = function(){
			$('<div class="spinner" id="spinner-' + that.tableIdSalt + '"></div>').appendTo(that.element);
		};
		
		this.animateSpinner = function(){
			var startColor = {
				r: 0x1E,
				g: 0x57,
				b: 0x99
			};
			var endColor = {
				r: 0x7D,
				g: 0xB9,
				b: 0xE8
			};
			var color = startColor;
			var steps = 20;
			var step = 0;
			var colorStr = '';
			this.spinnerAnimation = setInterval(function(){
				step++;
				if( step === 21 ){
					endColor = [startColor, startColor = endColor][0];
					step = 1;
				};
				color = {
					r: color.r+((endColor.r - startColor.r)/steps),
					g: color.g+((endColor.g - startColor.g)/steps),
					b: color.b+((endColor.b - startColor.b)/steps)
				};
				colorStr = '#'+(+Math.floor(color.r)).toString(16).toUpperCase()+(+Math.floor(color.g)).toString(16).toUpperCase()+(+Math.floor(color.b)).toString(16).toUpperCase();
				$('#spinner-' + that.tableIdSalt).css('background',colorStr);
			}, 25);
		};
		
		this.hideSpinner = function(){
			$('#spinner-' + that.tableIdSalt).hide();
			$('#spinner-' + that.tableIdSalt).stop();
			$(this.element).trigger('tableLoad:end');
			that.stopTab = false;
			that.isTabPressed = false;
			that.isDrawing = false;
			clearInterval(this.spinnerAnimation);
			if( that.defferredDraw ){
				that.defferredDraw = false;
				that.visibleFramePosition = that.defferredVisibleFramePosition;
				that.scrollTable();
			}
		};
		
		this.showSpinner = function(){
			$(this.element).trigger('tableLoad:start');
			$('#spinner-' + that.tableIdSalt).show();
			clearInterval(this.spinnerAnimation);
			that.animateSpinner();
		};
		
		this.moveSpinner = function(spinnerPosition){
			if( $('#spinner-' + that.tableIdSalt).length ){
				$('#spinner-' + that.tableIdSalt).css({
					'width' : spinnerPosition.width*that.zoom,
					'left' : spinnerPosition.offsetLeft,
					'top' : spinnerPosition.offsetTop
				});
			}
		};
		
		this.parseDate = function(input, format) {
			format = format || 'yyyy-mm-dd';
			var parts = input.match(/(\d+)/g), 
			i = 0, fmt = {};
			format.replace(/(yyyy|dd|mm)/g, function(part) { fmt[part] = i++; });
			return new Date(parts[fmt['yyyy']], parts[fmt['mm']]-1, parts[fmt['dd']]);
		};
		
		this.buildSelectArea = function(isStatic){
			if( that.selectArea.startCell.row !== -1 ){
				if(isStatic){
					that.drawStaticSelectArea();
				} else {
					that.drawDynamicSelectArea();
				}
			}
		};
		
		this.drawDynamicSelectArea = function(){
			if( $('.cell-edit').length ){
				return;
			}
			var selectStr = '';
			if( $('#lazy-table-select-'+that.tableIdSalt).length ){
				$('#lazy-table-select-'+that.tableIdSalt).remove();
			}
			if( that.selectArea.cellPosition.left > that.selectArea.cellPosition.right ){
				that.selectArea.cellPosition.left = that.selectArea.cellPosition.right + (that.selectArea.cellPosition.right=that.selectArea.cellPosition.left, 0);
			}
			if( that.selectArea.cellPosition.top > that.selectArea.cellPosition.bottom ){
				that.selectArea.cellPosition.top = that.selectArea.cellPosition.bottom + (that.selectArea.cellPosition.bottom=that.selectArea.cellPosition.top, 0);
			}
			var left = that.selectArea.cellPosition.left < that.realTableRange.left ? 
				that.realTableRange.left : 
				that.selectArea.cellPosition.left > that.realTableRange.right ?
					-1 : 
					that.selectArea.cellPosition.left;
			var top = that.selectArea.cellPosition.top < that.realTableRange.top ? 
				that.realTableRange.top : 
				that.selectArea.cellPosition.top > that.realTableRange.bottom ?
					-1 : 
					that.selectArea.cellPosition.top;
			var right = that.selectArea.cellPosition.right > that.realTableRange.right ?
				that.realTableRange.right :
				that.selectArea.cellPosition.right < that.realTableRange.left?
					-1 :
					that.selectArea.cellPosition.right;
			var bottom = that.selectArea.cellPosition.bottom > that.realTableRange.bottom ?
				that.realTableRange.bottom :
				that.selectArea.cellPosition.bottom < that.realTableRange.top?
					-1 :
					that.selectArea.cellPosition.bottom;
			if( left !== -1 && top !== -1 && right !== -1 && bottom !== -1 ){
				if( 
					$('#r'+top+'c'+left+'-'+that.tableIdSalt).length && 
					$('#r'+bottom+'c'+right+'-'+that.tableIdSalt).length 
				){
					that.deleteDynamicSelectedCells();
					for( i = top; i <= bottom; i++ ){
						for( j = left; j <= right; j++ ){
							if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).find('.cell-disabled').length ){
								unionId = $('#r'+i+'c'+j+'-'+that.tableIdSalt).data('unionid');
								if( typeof(unionId) === 'undefined' ){
									if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') ){
										$('#r'+i+'c'+j+'-'+that.tableIdSalt).addClass('cell-selected-dynamic-layer');
									}
									$('#r'+i+'c'+j+'-'+that.tableIdSalt).addClass('cell-selected-dynamic');
									(that.selectedCellsHelper[i]=that.selectedCellsHelper[i]||{})[j] = true;
									if( that.data.length !== 0 ){
										if( that.selectedCells.indexOf(that.data[i][j]) == -1 ){
											that.selectedCells.push(that.data[i][j]);
										}
									}
								} else {
									element = $('#r'+that.meta.cellSpanList[unionId].top+'c'+that.meta.cellSpanList[unionId].left+'-'+that.tableIdSalt);
									if( !element.hasClass('cell-selected') ){
										element.addClass('cell-selected-dynamic-layer');
									}
									element.addClass('cell-selected-dynamic');
									(that.selectedCellsHelper[that.meta.cellSpanList[unionId].top]=that.selectedCellsHelper[that.meta.cellSpanList[unionId].top]||{})[that.meta.cellSpanList[unionId].left] = true;
									if( that.data.length !== 0 ){
										if( that.selectedCells.indexOf(that.data[that.meta.cellSpanList[unionId].top][that.meta.cellSpanList[unionId].left]) == -1 ){
											that.selectedCells.push(that.data[that.meta.cellSpanList[unionId].top][that.meta.cellSpanList[unionId].left]);
										}
									}
								}
							}
						}
					}
					
				}
			}
		};
		
		this.drawStaticSelectArea = function(){
			$('.cell-selected-dynamic').removeClass('cell-selected-dynamic-layer');
			$('.cell-selected-dynamic').removeClass('cell-selected-dynamic');
			$('.cell-selected').removeClass('cell-selected-bottom');
			$('.cell-selected').removeClass('cell-selected-left');
			$('.cell-selected').removeClass('cell-selected-right');
			$('.cell-selected').removeClass('cell-selected-top');
			$('.cell-inner').removeClass('cell-selected-bottom');
			$('.cell-inner').removeClass('cell-selected-left');
			$('.cell-inner').removeClass('cell-selected-right');
			$('.cell-inner').removeClass('cell-selected-top');
			var selectedUnionsCell = [];
			$.each(that.selectArea.staticCells, function(rowIndex, row){
				$.each(row, function(colIndex, item){
					element = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
					element.addClass('cell-selected');
					if( !element.hasClass('cell-union') ){
						if( (that.selectArea.staticCells[parseInt(rowIndex)-1]=that.selectArea.staticCells[parseInt(rowIndex)-1]||{})[parseInt(colIndex)] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-top');
						}
						if( (that.selectArea.staticCells[parseInt(rowIndex)+1]=that.selectArea.staticCells[parseInt(rowIndex)+1]||{})[parseInt(colIndex)] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-bottom');
						}
						if( (that.selectArea.staticCells[parseInt(rowIndex)]=that.selectArea.staticCells[parseInt(rowIndex)]||{})[parseInt(colIndex)-1] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-left');
						}
						if( (that.selectArea.staticCells[parseInt(rowIndex)]=that.selectArea.staticCells[parseInt(rowIndex)]||{})[parseInt(colIndex)+1] !== true ) {
							$('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).addClass('cell-selected-right');
						}
					} else {
						unionId = $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt).data('unionid');
						selectedUnionsCell.push(unionId);
					}
				});
			});
			
			for( var q = 0; q < selectedUnionsCell.length; q++ ){
				unionId = selectedUnionsCell[q];
				var i;
				var j;
				i = that.meta.cellSpanList[unionId].top - 1;
				if( i !== -1){
					for( j = that.meta.cellSpanList[unionId].left; j <= that.meta.cellSpanList[unionId].right; j++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-bottom')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-bottom');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') ){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-bottom');
						}
					}
				}
				i = that.meta.cellSpanList[unionId].bottom + 1;
				if( i <= that.meta.rowCount ){
					for( j = that.meta.cellSpanList[unionId].left; j <= that.meta.cellSpanList[unionId].right; j++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-top')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-top');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected')){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-top');
						}
					}
				}
				j = that.meta.cellSpanList[unionId].left - 1;
				if( j !== -1 ){
					for( i = that.meta.cellSpanList[unionId].top; i <= that.meta.cellSpanList[unionId].bottom; i++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-right')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-right');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected')){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-right');
						}
					}
				}
				
				j = that.meta.cellSpanList[unionId].right + 1;
				if( j <= that.meta.colCount ){
					for( i = that.meta.cellSpanList[unionId].top; i <= that.meta.cellSpanList[unionId].bottom; i++ ){
						if( 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected') && 
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected-left')
						){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt).removeClass('cell-selected-left');
						} else if( !$('#r'+i+'c'+j+'-'+that.tableIdSalt).hasClass('cell-selected')){
							$('#r'+i+'c'+j+'-'+that.tableIdSalt+' .cell-inner').addClass('cell-selected-left');
						}
					}
				}
			}
		};
		
		this.deleteSelectedArea = function(){
			that.selectedCells = [];
			that.selectedCells.length = 0;
			that.selectArea.cellPosition = [];
			that.selectArea.cellPosition.length = 0;
			
		};
		
		this.deleteStaticSelectedCells = function(){
			that.selectArea.staticCells = {};
			that.deleteSelectedArea();
			$(that.tableWrapper).find('.cell-selected').removeClass('cell-selected-top cell-selected-bottom cell-selected-left cell-selected-right cell-selected');
		};
		
		this.deleteDynamicSelectedCells = function(){
			that.selectedCellsHelper = {};
			$(that.tableWrapper).find('.cell-selected-dynamic').removeClass('cell-selected-dynamic-layer');
			$(that.tableWrapper).find('.cell-selected-dynamic').removeClass('cell-selected-dynamic');
		};
		
		this.mergeSelectArea = function(){
			$.each(that.selectedCellsHelper, function(rowIndex, row){
				$.each(row, function(colIndex, item){
					
					if( (that.selectArea.staticCells[rowIndex]=that.selectArea.staticCells[rowIndex]||{})[colIndex] !== true ){
						that.selectArea.staticCells[rowIndex][colIndex] = true;
					}
				});
			});
		};
		
		this.updateTableCellList = function(tableCellList){
			$.each(tableCellList, function(key, tableCellItem){
				if (!(that.data[tableCellItem.rowIndex] && that.data[tableCellItem.rowIndex][tableCellItem.colIndex])){
					return;
				}
				var cellId = getLgCellId(tableCellItem,that);
				var cellElement = $(cellId);
				if( cellElement.hasClass('cell-under-edit')){
					return;
				}
				$.each($(cellId).find('.cell-filled'), function(key,value){
					$(value).removeClass('cell-filled');
				});
				that.createCellContent(tableCellItem);
			});
		};
		
		this.loadCellMenu = function(menuItemList){
			var menuElement = lgContextMenu;
			menuElement.empty();
			menuElement.off("menuselect");
			menuElement.on( "menuselect", function( event, ui ) {
				$(this).hide();
				var menuItem = event.originalEvent.currentTarget.menuItem;
				var tableCell = event.target.tableCell;
				var menuItemContext = {
					targetCell: tableCell,
					selectedCellList: that.selectedCells,
					selectedMenuItem: menuItem
				};
				that.initialData.onMenuItemSelect(menuItemContext);
			} );
			
			$.each(menuItemList, function(key, menuItem){
				var menuItemElement = $('<li><a href="#">' + menuItem.menuItemName + '</a></li>');
				menuItemElement.appendTo(menuElement);
				menuItemElement.each(function(){
					this.menuItem = menuItem;
				});
			});
			lgContextMenu.menu( "refresh" );
			lgContextMenu.show();
		};
		
		this.hurtMe = function(){
			that.hideSpinner();
			$('#lazyTable-'+that.tableIdSalt).remove();
			$(that.tableWrapper).html('Размер таблицы превышает возможности браузера');
		};
		
		this.saveData = function(cellsData){
			for( var i = 0; i < cellsData.length; i++ ){
				// cellsData[i].rowIndex
				// cellsData[i].colIndex
				if( typeof(that.data[cellsData[i].rowIndex]) === 'undefined' ){
					that.data[cellsData[i].rowIndex] = [];
					that.data[cellsData[i].rowIndex][cellsData[i].colIndex] = cellsData[i];
				} else if( typeof(that.data[cellsData[i].rowIndex][cellsData[i].colIndex]) === 'undefined' ){
					that.data[cellsData[i].rowIndex][cellsData[i].colIndex] = cellsData[i];
				}
			}
		};
		
		this.drawCell = function(cellElement){
			var rowIndex = $(cellElement).data('row');
			var colIndex = $(cellElement).data('col');
			if( typeof(that.data[rowIndex]) !== 'undefined'){
				if( typeof(that.data[rowIndex][colIndex]) !== 'undefined' ){
					if( 
						$(cellElement).find('.cell-inner').length && 
						!$(cellElement).find('.cell-filled').length
					){
						var cell = that.data[rowIndex][colIndex];
						var cellElementInner = $(cellElement).find('.cell-inner');
						cellElementInner.html(cell.contentValue);
						cellElementInner.addClass('' + (typeof(cell.styleNameSet) !== 'undefined'? cell.styleNameSet : ''));
						cellElementInner.addClass('' + (typeof(that.realColumns[cell.colIndex]) !== 'undefined'? that.realColumns[cell.colIndex].styleNameSet : that.meta.defaultColumn.styleNameSet));
						cellElementInner.addClass('' + (typeof(that.realRows[cell.rowIndex]) !== 'undefined'? that.realRows[cell.rowIndex].styleNameSet : that.meta.defaultRow.styleNameSet));
						cellElementInner.addClass('cell-filled');
						
						var cellElemenStyle = ' '+ (typeof(cell.style) !== 'undefined'? cell.style : '');
						cellElementInner.attr("style", cellElementInner.attr("style") + "; " + cellElemenStyle);
					}
				}
			}			
		};
		
		this.setFixedOverlap = function(overlapTop, overlapLeft){
			that.overlapTop = overlapTop;
			that.overlapLeft = overlapLeft;
		};
		
		this.getDiffBetweenCells = function(){
			var diffs = {}
				i,
				offsetTopStart = 0, 
				offsetLeftStart = 0, 
				offsetTopEnd = 0, 
				offsetLeftEnd = 0;
			for( i = 0; i < that.startCellTabbing.row; i++ ){
				offsetTopStart += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			
			for( i = 0; i < that.startCellTabbing.col; i++ ){
				offsetLeftStart += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			
			for( i = 0; i < that.endCellTabbing.row; i++ ){
				offsetTopEnd += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
			}
			
			for( i = 0; i < that.endCellTabbing.col; i++ ){
				offsetLeftEnd += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
			}
			diffs = {
				top: offsetTopEnd - offsetTopStart,
				left: offsetLeftEnd - offsetLeftStart
			};
			return diffs;
		};

		this.fillTable = function(cellsData){
			switch(that.stabbing){
				case 'next':
					var editableCell = false;
					for( var i=0; i < cellsData.length; i++ ){
						if( isLgCellEditable(cellsData[i]) ){
							var unionId = that.getUnionId(cellsData[i].rowIndex, cellsData[i].colIndex);
							if( typeof(that.cellsUnions.merged[unionId]) === 'undefined' ){
								that.endCellTabbing = {
									row: cellsData[i].rowIndex,
									col: cellsData[i].colIndex,
								};
								i = cellsData.length;
								editableCell = true;
							}
						}
					}
					if( editableCell ){
						that.currentActiveCell = {
							row: that.endCellTabbing.row,
							col: that.endCellTabbing.col
						};
						var diffs = that.getDiffBetweenCells();
						that.stabbing = 'none';
						that.startCellTabbing = {};
						that.crutch = true;
						that.crutch2 = false;
						if( diffs.top != 0 || diffs.left != 0 ){
							if( diffs.top !== 0 ){
								$(this.element).trigger('tableMove', [{
									action: 'nextRow', 
									offset: { 
										top: diffs.top,
										left: 0
									}
								}]);
							}
							that.crutch = false;
							if( diffs.left !== 0 ){
								$(this.element).trigger('tableMove', [{
									action: 'nextCell', 
									offset: { 
										top: 0,
										left: diffs.left
									}
								}]);
							}						
						} else {
							that.focusCell();
							that.crutch2 = true;
							that.hideSpinner();
						}
					} else {
						that.currentActiveCell = {
							row: cellsData[cellsData.length-1].rowIndex,
							col: cellsData[cellsData.length-1].colIndex
						};
						that.getNextEditableCell();
					}					
					break;
				case 'prev':
					var editableCell = false;
					for( var i=cellsData.length-1; i >= 0 ; i-- ){
						if( isLgCellEditable(cellsData[i]) ){
							var unionId = that.getUnionId(cellsData[i].rowIndex, cellsData[i].colIndex);
							if( typeof(that.cellsUnions.merged[unionId]) === 'undefined' ){
								that.endCellTabbing = {
									row: cellsData[i].rowIndex,
									col: cellsData[i].colIndex,
								};
								i = -1;
								editableCell = true;
							}
						}
					}
					if( editableCell ){
						that.currentActiveCell = {
							row: that.endCellTabbing.row,
							col: that.endCellTabbing.col
						};
						var diffs = that.getDiffBetweenCells();
						that.stabbing = 'none';
						that.startCellTabbing = {};
						that.crutch = true;
						that.crutch2 = false;
						if( diffs.top != 0 || diffs.left != 0 ){
							if( diffs.top !== 0 ){
								$(this.element).trigger('tableMove', [{
									action: 'previousRow', 
									offset: { 
										top: diffs.top,
										left: 0
									}
								}]);
							}
							
							that.crutch = false;
							if( diffs.left !== 0 ){
								$(this.element).trigger('tableMove', [{
									action: 'previousCell', 
									offset: { 
										top: 0,
										left: diffs.left
									}
								}]);
							}
						} else {
							that.focusCell();
							that.crutch2 = true;
							that.hideSpinner();
						}
						
					} else {
						that.currentActiveCell = {
							row: cellsData[0].rowIndex,
							col: cellsData[0].colIndex
						};
						that.getPreviousEditableCell();
					}
					break;
				default:
					
						var isDataSet = false;
						that.timer = {};
						that.timerServerOnSelect = {};
						that.timerTime = 0;
						that.tooltipPosition = '';

						that.ctrlPressed = false;
						that.shiftPressed = false;

						that.leftMouse = 0;
						that.rightMouse = 2;

						that.saveData(cellsData);

						$('#lazyTable-'+that.tableIdSalt+'-wrapper .cell').each(function(key, item){
							that.drawCell(this);
						});

						$(that.element).trigger('fillFixedCells',[that.tableIdSalt]);

						that.buildSelectArea(true);
						if( !that.crutch){
							that.focusCell();
							that.crutch2 = true;
						}
						that.hideSpinner();
					break;
			}
		};
		
		this.focusCell = function(){
			if (that.useActiveCell){
				/*if( !that.defferredDraw ){
					that.useActiveCell = false;
				}*/
				var cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
				var rowIndex = cellElement.data('row');
				var colIndex = cellElement.data('col');
				isDataSet = isCellDataSet(rowIndex, colIndex, that);
				if( isDataSet ){
					if( isLgCellEditable(that.data[rowIndex][colIndex]) ){
						that.useActiveCell = false;
						cellElement = cellElement.find('.cell-inner');
						that.startCellEdit(cellElement);
					}
				}
			}
		};
		
		this.setZoom = function(zoom){
			/*var ie = getInternetExplorerVersion();
			if( ie >= 8 * ie <= 9 ){*/
				that.zoom = parseFloat(zoom.toFixed(3));
			//}			
		};
		
		this.clickFixedCell = function(cellElement){
			that.selectArea.startCell.col = cellElement.data('col');
			that.selectArea.startCell.row = cellElement.data('row');
			var e = false;
			that.editCellEvent(e, cellElement);
		};
		
		this.editCellEvent = function(e,cellElement){
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');
			if( 
				that.selectArea.startCell.row === rowIndex && 
				that.selectArea.startCell.col === colIndex 
			){
				clearTimeout(that.timerServerOnSelect);
				that.startCellEdit(cellElement, e, true);
			} else {
				var unionid1 = $(cellElement).data('unionid');
				var unionid2 = $('#'+'r'+that.selectArea.startCell.row+'c'+that.selectArea.startCell.col+'-'+that.tableIdSalt).data('unionid');
				if( typeof(unionid1) !== 'undefined' && typeof(unionid2) !== 'undefined' ){
					if( unionid1 == unionid2 ){
						clearTimeout(that.timerServerOnSelect);
						that.startCellEdit(cellElement, e, true);
					}
				}
			}
		};
		
		this.getNextEditableCell = function(){
			that.tabDirection = 'forward';
			var cellElement = {};
			if( typeof(that.startCellTabbing.row) === 'undefined' ){
				that.startCellTabbing = {
					row: that.currentActiveCell.row,
					col: that.currentActiveCell.col
				};
			}
			if( that.currentActiveCell.col < ( that.meta.colCount - 1) ){
				that.currentActiveCell.col += 1;
				cellElement =  getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);				
			} else if( that.currentActiveCell.row < (that.meta.rowCount - 1) ){
				that.currentActiveCell.row += 1;
				that.currentActiveCell.col = 0;
				cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
			} else {
				that.serverEvent('onMoveNextTable', []);
				$(this.element).trigger( 'tableMove', [{action: 'nextTable'}] );
				$('.cell-edit').trigger( "blur" );
				return;
			}
			var elementWidth = typeof(that.realColumns[that.currentActiveCell.col]) !== 'undefined'? 
				that.realColumns[that.currentActiveCell.col].width : that.meta.defaultColumn.width;
			var elementHeight = typeof(that.realRows[that.currentActiveCell.row]) !== 'undefined'? 
						that.realRows[that.currentActiveCell.row].height : that.meta.defaultRow.height;
			
			
			if( !cellElement.length ){
				that.stabbing = 'next';
				that.useActiveCell = true;
				that.getNextEditableCellRange(that.currentActiveCell.row, that.currentActiveCell.col);
				return;
			} else {
				var elementPositionRight = Math.abs($(cellElement).position().left)+$(cellElement).width();
				var visibleFramePositionRight = (that.visibleFramePosition.offsetLeft + that.visibleFramePosition.tableWidth)*that.zoom;
				if( visibleFramePositionRight < elementPositionRight ){
					that.stabbing = 'next';
					that.useActiveCell = true;
					that.getNextEditableCellRange(that.currentActiveCell.row, that.currentActiveCell.col);
					return;
				}
				var elementPositionBottom = Math.abs($(cellElement).position().top)+$(cellElement).height();
				var visibleFramePositionBottom = (that.visibleFramePosition.offsetTop + that.visibleFramePosition.tableHeight)*that.zoom;
				if( visibleFramePositionBottom < elementPositionBottom ){
					that.stabbing = 'next';
					that.useActiveCell = true;
					that.getNextEditableCellRange(that.currentActiveCell.row, that.currentActiveCell.col);
					return;
				}
			}
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');
			
			var isDataSet = isCellDataSet(rowIndex, colIndex, that);
			if( isDataSet ){
				var unionId = that.getUnionId(rowIndex, colIndex);
				if( isLgCellEditable(that.data[rowIndex][colIndex]) && typeof(that.cellsUnions.merged[unionId]) === 'undefined' ){
					cellElement = cellElement.find('.cell-inner');
					that.startCellEdit(cellElement);
				} else {
					that.getNextEditableCell();
				}
			} else {
				that.canMoveNextEdit = true;
			}
		};
		
		this.getNextEditableCellRange = function(row, col){
			that.showSpinner();
			var startLeft = col;
			var tabRange = {
				left: 	col,
				top:	row,
				right:	col,
				bottom:	row
			};
			while((tabRange.right<that.meta.colCount-1)&&((tabRange.right - startLeft) < 10)){
				tabRange.right++;
			}
			if( typeof that.initialData.build === 'function' ){
				that.initialData.build.call( that, that, [tabRange]);
			}
			return tabRange;
		};
		
		this.getPreviousEditableCell = function(){
			that.tabDirection = 'back';
			var cellElement = {};
			if( typeof(that.startCellTabbing.row) === 'undefined' ){
				that.startCellTabbing = {
					row: that.currentActiveCell.row,
					col: that.currentActiveCell.col
				};
			}
			if( that.currentActiveCell.col != 0 ){
				that.currentActiveCell.col -= 1;
				cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
			} else if( that.currentActiveCell.row != 0 ){
				that.currentActiveCell.row -= 1;
				that.currentActiveCell.col = that.meta.colCount - 1;
				cellElement = getLgCellElementByCoordinates(that.currentActiveCell.row, that.currentActiveCell.col, that);
			} else {
				that.serverEvent('onMovePrevTable', []);
				$(this.element).trigger( 'tableMove', [{action: 'previousTable'}] );
				$('.cell-edit').trigger( "blur" );
				return;
			}
			var elementWidth = typeof(that.realColumns[that.currentActiveCell.col]) !== 'undefined'? 
				that.realColumns[that.currentActiveCell.col].width : that.meta.defaultColumn.width;
			var elementHeight = typeof(that.realRows[that.currentActiveCell.row]) !== 'undefined'? 
						that.realRows[that.currentActiveCell.row].height : that.meta.defaultRow.height;
			if( !cellElement.length ){
				that.stabbing = 'prev';
				that.useActiveCell = true;
				that.getPreviousEditableCellRange(that.currentActiveCell.row, that.currentActiveCell.col);
				return;
			} else {
				var visibleFramePositionLeft = that.visibleFramePosition.offsetLeft*that.zoom;
				var elementPositionLeft = Math.abs($(cellElement).position().left);
				elementPositionLeft = Math.abs($(cellElement).position().left);
				if( (visibleFramePositionLeft+that.overlapLeft) > elementPositionLeft ){
					that.stabbing = 'prev';
					that.useActiveCell = true;
					that.getPreviousEditableCellRange(that.currentActiveCell.row, that.currentActiveCell.col);
					return;
				}
				var visibleFramePositionTop = that.visibleFramePosition.offsetTop*that.zoom;
				var elementPositionTop = Math.abs($(cellElement).position().top);
				elementPositionTop = Math.abs($(cellElement).position().top);
				if( (visibleFramePositionTop+that.overlapTop) > elementPositionTop ){
					that.stabbing = 'prev';
					that.useActiveCell = true;
					that.getPreviousEditableCellRange(that.currentActiveCell.row, that.currentActiveCell.col);
					return;
				}
			}
			var rowIndex = cellElement.data('row');
			var colIndex = cellElement.data('col');

			if( cellElement.find('.cell-disabled').length ){
				that.getPreviousEditableCell();
			}
			var isDataSet = isCellDataSet(rowIndex, colIndex, that);
			if( isDataSet ){
				var unionId = that.getUnionId(rowIndex, colIndex);
				if( isLgCellEditable(that.data[rowIndex][colIndex]) && typeof(that.cellsUnions.merged[unionId]) === 'undefined' ){
					cellElement = cellElement.find('.cell-inner');
					that.startCellEdit(cellElement);
				} else {
					that.getPreviousEditableCell();
				}
			} else {
				that.canMoveNextEdit = true;
			}
		};
		
		this.getPreviousEditableCellRange = function(row, col){
			that.showSpinner();
			var startLeft = col;
			var tabRange = {
				left: 	col,
				top:	row,
				right:	col,
				bottom:	row
			};
			//while((tabRange.right<that.meta.colCount-1)&&((tabRange.right - startLeft) < 10)){
			while((tabRange.left>0)&&((startLeft - tabRange.left) < 10)){
				tabRange.left--;
			}
			if( typeof that.initialData.build === 'function' ){
				that.initialData.build.call( that, that, [tabRange]);
			}
			return tabRange;
		};
		
		this.addEventListeners = function (){
			var clickTimer;
			var countRightClick = 0;
			var rightClickTimer;
			var timeToDblclick = 300;
			var dblClick = false;
			$(document).mousedown(function(e) {
				// The latest element clicked
				e = e || window.event;
				that.clicky = $(e.target);
			});

			$(document).mouseup(function(e) {
				that.clicky = null;
			});
			
			$(document).bind('keydown', function (event) {
				switch (event.keyCode) {
					case 18:
						that.altPressed = true;
						break;
					case 17:
						that.ctrlPressed = true;
						break;
					case 16:
						that.shiftPressed = true;
						break;
					default:
						break;
				}
			});
			$(document).bind('keyup', function (event) {
				switch (event.keyCode) {
					case 18:
						that.altPressed = false;
						break;
					case 17:
						that.ctrlPressed = false;
						break;
					case 16:
						that.shiftPressed = false;
						break;
					default:
						break;
				}
			});
			
			var tazyTableElement = document.getElementById('lazyTable-'+that.tableIdSalt);
			
			$(tazyTableElement).on('keyup', function(event){
				switch (event.keyCode) {
					case 9:
						that.isTabPressed = false;
						break;
					default:
						break;				
				}				
			});
			
			$(document).on('keydown', function(event){
				switch (event.keyCode) {
					case 9:
						if( that.stopTab ){
							event.preventDefault();
						}
					break;
					default:
					break;
				}
			});
			
			$(tazyTableElement).on('keydown', function(event){
				switch (event.keyCode) {
					case 9:
						event.preventDefault();
						if( !that.stopTab && that.canMoveNextEdit && !that.isTabPressed ){
							that.isTabPressed = true;
							that.canMoveNextEdit = false;
							if( event.shiftKey ){
								that.getPreviousEditableCell();
							}else {
								that.getNextEditableCell();
							}
						}
						break;
					default:
						break;
				}
			});
			
			
			
			tazyTableElement.onclick = function(e){
				clearTimeout(clickTimer);
				e = e || window.event;
				target = e.target || e.srcElement;
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				cellElement = getLgCellElement($(elementMouseIsOver));
				if( cellElement.hasClass('lazy-table-select') ){
					cellElement.hide();
					x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = getLgCellElement($(elementMouseIsOver));
				}
				if( !cellElement.find('.cell-edit').length && !cellElement.hasClass('cell-edit') && !cellElement.hasClass('cell-disabled') && !cellElement.hasClass('cell-under-edit')){
					var ct = that.ctrlPressed, 
						at = that.altPressed,
						sh = that.shiftPressed;
					clickTimer = setTimeout(function(){
						var rowIndex = cellElement.data('row');
						var colIndex = cellElement.data('col');
						eventParameters = {
							doubleClick: false,
							mouseButton: 0,
							keyAlt: at,
							keyShift: sh,
							keyCtrl: ct
						};
						if( !dblClick ){
							that.serverEvent('onMouseClick', [that.data[rowIndex][colIndex]], eventParameters);
						}
						dblClick = false;
					}, timeToDblclick);
					if( !that.ctrlPressed && !that.shiftPressed ){
						var rowIndex = cellElement.data('row');
						var colIndex = cellElement.data('col');
						if( cellElement.hasClass('cell-union') ){
							cellElement.parent().hide();
							x = e.clientX, y = e.clientY,
							elementMouseIsOver = document.elementFromPoint(x, y);
							cellElement.parent().show();
							unionPartCellElement = $(elementMouseIsOver);
							if( unionPartCellElement.hasClass('cell-inner') ){
								rowIndex = unionPartCellElement.data('row');
								colIndex = unionPartCellElement.data('col');
							}
						}
						
						that.editCellEvent(e, cellElement);
					}
				}
			};
			
			tazyTableElement.ondblclick = function(e){
				e = e || window.event;
				target = e.target || e.srcElement;
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				cellElement = getLgCellElement($(elementMouseIsOver));
				if( cellElement.hasClass('lazy-table-select') ){
					cellElement.hide();
					x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = getLgCellElement($(elementMouseIsOver));
				}
				if( cellElement.hasClass('cell-inner')){
					dblClick = true;
					clearTimeout(clickTimer);
					var rowIndex = cellElement.data('row');
					var colIndex = cellElement.data('col');
					var ct = that.ctrlPressed, 
						at = that.altPressed,
						sh = that.shiftPressed;
					eventParameters = {
						doubleClick: true,
						mouseButton: 0,
						keyAlt: at,
						keyShift: sh,
						keyCtrl: ct						
					};
					that.serverEvent('onMouseClick', [that.data[rowIndex][colIndex]], eventParameters);
				}
			};
			
			$(document).on('mouseup', function(e){
				if( typeof(e) === 'undefined' ){
					e = window.event;
					that.leftMouse = 1;
					that.rightMouse = 2;
				}
				if( e.button === that.leftMouse && that.mousedown ){
					that.mergeSelectArea();
					that.drawStaticSelectArea();
					clearTimeout(that.timerServerOnSelect);
					that.timerServerOnSelect = setTimeout(function(){
						that.serverEvent('onSelect', that.selectedCells);
					},500);
					that.mousedown = false;
				}	
			});
			
			tazyTableElement.onmousedown = function(e) {
				if( typeof(e) === 'undefined' ){
					e = window.event;
					that.leftMouse = 1;
					that.rightMouse = 2;
				}
				if( e.button === that.leftMouse ){
					target = e.target || e.srcElement;
					var x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = getLgCellElement($(elementMouseIsOver));
					if( cellElement.hasClass('lazyTable-tooltip') ){
						cellElement.hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement = $(elementMouseIsOver);
						$('#lazyTable-'+that.tableIdSalt+'-tooltip').show();
					}
					if( cellElement.hasClass('cell-union') ){
						oldCellElement = cellElement;
						cellElement.parent().hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement.parent().show();
						cellElement = $(elementMouseIsOver);
						if( !cellElement.hasClass('cell-inner') ){
							cellElement = oldCellElement;
						}
					}
					if( cellElement.hasClass('cell-inner') && !cellElement.hasClass('cell-under-edit') ){
						if( !(that.ctrlPressed && that.selectArea.startCell.row !== -1) ){
							that.deleteStaticSelectedCells();
						}
						that.deleteDynamicSelectedCells();
						if( that.shiftPressed ){
							if( that.selectArea.lastCell.row === -1 ){
								that.selectArea.lastCell = {
									'col': cellElement.data('col'),
									'row': cellElement.data('row')
								};
							}
							that.selectArea.cellPosition.left = that.selectArea.lastCell.col;
							that.selectArea.cellPosition.top = that.selectArea.lastCell.row;
							that.selectArea.cellPosition.right = cellElement.data('col');
							that.selectArea.cellPosition.bottom = cellElement.data('row');
							that.selectArea.startCell.col = that.selectArea.lastCell.left;
							that.selectArea.startCell.row = that.selectArea.lastCell.top;
						} else {
							that.selectArea.cellPosition.left = cellElement.data('col');
							that.selectArea.cellPosition.top = cellElement.data('row');
							that.selectArea.cellPosition.right = cellElement.data('col');
							that.selectArea.cellPosition.bottom = cellElement.data('row');
							that.selectArea.startCell.col = that.selectArea.cellPosition.left;
							that.selectArea.startCell.row = that.selectArea.cellPosition.top;
						}
						
						if( that.ctrlPressed || that.shiftPressed ){
							that.buildSelectArea();
						}
						
						that.selectArea.lastCell = {
							'col': cellElement.data('col'),
							'row': cellElement.data('row')
						};
						e.preventDefault ? e.preventDefault() : (e.returnValue = false);
						that.mousedown = true;
					}
					if( !$(target).hasClass('cell-edit') ){
						$('.cell-edit').trigger( "blur" );
						return false;
					}
				} else if( e.button === that.rightMouse ){
					
					target = e.target || e.srcElement;
					var x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = getLgCellElement($(elementMouseIsOver));
					if( cellElement.hasClass('lazy-table-select') ){
						cellElement.hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement = getLgCellElement($(elementMouseIsOver));
					}
					if( cellElement.hasClass('cell-inner')){
						clearTimeout(rightClickTimer);
						var ct = that.ctrlPressed, 
							at = that.altPressed,
							sh = that.shiftPressed;
						rightClickTimer = setTimeout(function(){
							var rowIndex = cellElement.data('row');
							var colIndex = cellElement.data('col');
							eventParameters = {
								doubleClick: countRightClick > 1? true : false,
								mouseButton: 1,
								keyAlt: at,
								keyShift: sh,
								keyCtrl: ct		
							};
							that.serverEvent('onMouseClick', [that.data[rowIndex][colIndex]], eventParameters);
							countRightClick = 0;
						}, timeToDblclick);
					}	
				}
			};
			
			tazyTableElement.onmouseup = function(e) {
				if( typeof(e) === 'undefined' ){
					e = window.event;
				}
				if( e.button === that.rightMouse ){
					countRightClick +=1;
				}
			};
			
			tazyTableElement.onselectstart = function(e) { 
				e = e || window.event;
				target = e.target || e.srcElement;
				if( !$(target).hasClass('cell-edit') ){
					return false;
				}
			};
			
			tazyTableElement.onmousemove = function(e){
				e = e || window.event;
				var x = e.clientX, y = e.clientY,
				elementMouseIsOver = document.elementFromPoint(x, y);
				cellElement = getLgCellElement($(elementMouseIsOver));
				if( cellElement.hasClass('lazyTable-tooltip') ){
					cellElement.hide();
					x = e.clientX, y = e.clientY,
					elementMouseIsOver = document.elementFromPoint(x, y);
					cellElement = $(elementMouseIsOver);
					$('#lazyTable-'+that.tableIdSalt+'-tooltip').show();
				}
				if( that.mousedown ){
					if( cellElement.hasClass('cell-union') ){
						oldCellElement = cellElement;
						cellElement.parent().hide();
						x = e.clientX, y = e.clientY,
						elementMouseIsOver = document.elementFromPoint(x, y);
						cellElement.parent().show();
						cellElement = $(elementMouseIsOver);
						if( !cellElement.hasClass('cell-inner') ){
							cellElement = oldCellElement;
						}
					}
					var colIndex = cellElement.data('col');
					var rowIndex = cellElement.data('row');
					if( colIndex < that.selectArea.startCell.col ){
						if( colIndex !== that.selectArea.cellPosition.left ){
							that.selectArea.cellPosition.left = colIndex;
							that.buildSelectArea();
						}
					} else if( colIndex > that.selectArea.startCell.col ){
						if( colIndex !== that.selectArea.cellPosition.right ){
							that.selectArea.cellPosition.right = colIndex;
							that.buildSelectArea();
						}
					} else {
						if( that.selectArea.cellPosition.left !== that.selectArea.cellPosition.right ){
							that.selectArea.cellPosition.left = that.selectArea.startCell.col;
							that.selectArea.cellPosition.right = that.selectArea.startCell.col;
							that.buildSelectArea();
						}
					}
					
					if( rowIndex < that.selectArea.startCell.row ){
						if( rowIndex !== that.selectArea.cellPosition.top ){
							that.selectArea.cellPosition.top = rowIndex;
							that.buildSelectArea();
						}
					} else if( rowIndex > that.selectArea.startCell.row ){
						if( rowIndex !== that.selectArea.cellPosition.bottom ){
							that.selectArea.cellPosition.bottom = rowIndex;
							that.buildSelectArea();
						}
					} else {
						if( that.selectArea.cellPosition.top !== that.selectArea.cellPosition.bottom ){
							that.selectArea.cellPosition.top = that.selectArea.startCell.row;
							that.selectArea.cellPosition.bottom = that.selectArea.startCell.row;
							that.buildSelectArea();
						}
					}
					that.selectArea.lastCell = {
						row: rowIndex,
						col: colIndex
					};
				}
				
				
				if( !cellElement.hasClass('cell-inner') || cellElement.text() === ''  ){
					clearTimeout(that.timer);
					return;
				}
				var cell = that.data[cellElement.data('row')][cellElement.data('col')];
				
				clearTimeout(that.timer);
				that.timer = setTimeout(function(){
					$('.lazyTable-tooltip').remove();
					if( typeof(cell) !== 'undefined' ){
						var offset = $('#'+'lazyTable-'+that.tableIdSalt).offset();
						var tooltipElement = $('<div/>',{
							'id': 'lazyTable-'+that.tableIdSalt+'-tooltip',
							'class': 'lazyTable-tooltip',
							'css': {
								'top': y + 10,
								'left': x + 10
							} 
						});
						tooltipElement.html(cell.contentValue);
						tooltipElement.appendTo('html');
					}					
				}, 100);
			};
			
			tazyTableElement.onmouseleave = function(e){
				clearTimeout(that.timer);
				$('.lazyTable-tooltip').remove();
			};	
		};
		
		this.scrollTable = function(){
			if( !that.isDrawing ){
				that.offsetTopTotal = that.visibleFramePosition.offsetTop;
				that.offsetLeftTotal = that.visibleFramePosition.offsetLeft;
				that.isDrawing = true;
				that.stopTab = true;
				that.determinateDisplayedCellsAndRows();
				that.addUnionToTableRange();
				that.displayTable();
				if( that.needRebuild ){
					that.showSpinner();
					if( typeof that.initialData.build === 'function' && that.needRebuild ){
						that.initialData.build.call( that, that, that.tableServerCellRange);
					}else {
						that.hideSpinner();
					}	
				} else {
					that.isDrawing = false;
					that.stopTab = false;
					
					/*if( $(that.element).outerWidth() < $(that.tableWrapper).outerWidth() ){
						var fixedTableWidth = (that.visibleFramePosition.tableWidth+that.visibleFramePosition.offsetLeft) > ($(that.element).outerWidth() - getScrollBarWidth(that.element))? 
							(that.visibleFramePosition.tableWidth - getScrollBarWidth(that.element)) :
							that.visibleFramePosition.tableWidth
						;
					} else {
						var fixedTableWidth = that.visibleFramePosition.tableWidth;
					}
					
					if( $(that.element).outerHeight() < $(that.tableWrapper).outerHeight() ){
						var fixedTableHeight = (that.visibleFramePosition.tableHeight+that.visibleFramePosition.offsetTop) > ($(that.element).outerHeight() - getScrollBarWidth(that.element))? 
							(that.visibleFramePosition.tableHeight - getScrollBarWidth(that.element)) :
							that.visibleFramePosition.tableHeight
						;
					} else {
						var fixedTableHeight = that.visibleFramePosition.tableHeight;
					}*/
					/*var ie = getInternetExplorerVersion();
					if( ie >= 8 * ie <= 9 ){
						var tblWidth = that.visibleFramePosition.tableWidth/that.zoom;
						var tblHeight = that.visibleFramePosition.tableHeight/that.zoom;
					} else {*/
						var tblWidth = that.visibleFramePosition.tableWidth;
						var tblHeight = that.visibleFramePosition.tableHeight;
					//}
					
					var fixedTableWidth = (tblWidth+that.visibleFramePosition.offsetLeft) < $(that.tableWrapper).outerWidth() ?
							(tblWidth - getScrollBarWidth(that.element)) :
							tblWidth;
							
					var fixedTableHeight = (tblHeight+that.visibleFramePosition.offsetTop) < $(that.tableWrapper).outerHeight() ?
							(tblHeight - getScrollBarWidth(that.element)) :
							tblHeight;
					
					$(that.element).trigger('fixedCellsEvent', [{
						tableId: 			that.tableIdSalt,
						meta: 				that.meta,
						cellsOffsetLeft:	that.offsetsLeft,
						cellsOffsetTop:		that.offsetsTop,
						cellsUnions:		that.cellsUnions,
						realTableRange: 	that.realTableRange,
						viewportOffsetTop:	that.visibleFramePosition.offsetTop,
						viewportOffsetLeft:	that.visibleFramePosition.offsetLeft,
						tableWidth:			fixedTableWidth,
						tableHeight:		fixedTableHeight,
						tableCellRange:		that.tableCellRange,
						realTableHeight:	that.realTableHeight,
						realTableWidth:		that.realTableWidth,
						zoom:				that.zoom
					}]);
					
					that.focusCell();
				}
				return true;
			} else {
				return false;
			}
		};
		
		this.destroy = function(){
			$('.context-menu').remove();
			$('.lazyTable-tooltip').remove();
			$(that.element).empty();
			that.previousTableRange = {
				left: -1,
				right: -1,
				top: -1,
				bottom: -1	
			};
			that.data = [];
			that.data.length = 0;
			
			that.visibleFramePosition = {
				offsetTop: 0,
				offsetLeft: 0,
				tableWidth: 0,
				tableHeight: 0			
			};
			
			$(that.element).trigger('fixedCellsEvent', [{
				hide:				true,
				tableId: 			that.tableIdSalt
			}]);
		};
		
		this.reloadTable = function(meta){
			if( typeof(meta) === 'undefined' ){
				meta = that.meta;
			}
			if( typeof(meta) === 'undefined' ){
				return;
			}
			
			that.meta = meta;
			
			that.previousTableRange = {
				left: -1,
				right: -1,
				top: -1,
				bottom: -1	
			};
			
			that.offsetTopTotal = that.visibleFramePosition.offsetTop;
			that.offsetLeftTotal = that.visibleFramePosition.offsetLeft;
			
			if( that.visibleFramePosition.tableWidth > 0 && that.visibleFramePosition.tableHeight > 0 ) {
				if( that.tableWrapper.length ){
					that.realTableHeight = 0;
					that.realTableWidth = 0;
				}
				$(that.element).empty();
				
				$('<div/>',{
					'id': 'lazyTable-'+that.tableIdSalt+'-wrapper',
					'class': 'lazyTable-wrapper'
				}).appendTo(that.element);
				that.tableWrapper = $('#'+'lazyTable-'+that.tableIdSalt+'-wrapper');
				that.init();
				that.createSpinner();
				that.moveSpinner({
					'width' : that.visibleFramePosition.tableWidth,
					'offsetLeft' : that.visibleFramePosition.offsetLeft,
					'offsetTop' : that.visibleFramePosition.offsetTop
				});
				that.showSpinner();
				that.determinateDisplayedCellsAndRows();
				
				that.determinateMergedUnions();
				
				that.data = [];
				that.data.length = 0;
				that.needRebuild = true;
				
				var isItTooBig = that.displayTable();
				
				if( !isItTooBig ){
					that.addUnionToTableRange();
					that.serverEvent = function(eventType, cellList, eventParameters){
						var params = eventParameters || {};
						if( typeof that.initialData.event === 'function' ){
							that.initialData.event.call( that, 
								{
									event: eventType,
									source: cellList,
									eventParameters: params
								}
							);
						} else {
							that.click = function(cellList){};
						}	
					};
					if( typeof that.initialData.build === 'function' ){
						that.initialData.build.call( that, that, that.tableServerCellRange);
					} else {
						that.hideSpinner();
					}
					that.addEventListeners();
				} else {
					that.hurtMe();
				}
			}
		};
	}
	
	$.fn.lazyGrid = function( data ) {
		this.lazyGrid = new LazyGrid();
		var that = this;
		this.lazyGrid.element = this;
		
		this.lazyGrid.initialData = data;
		
		this.each(function() {
		    this.lgInstance = that;
		});
		
		
		/*this.lazyGrid.meta = data.meta;
		this.lazyGrid.init();
		
		this.css({
			'width' : this.lazyGrid.realTableWidth + 'px',
			'height' : this.lazyGrid.realTableHeight + 'px',
		});*/
		
		return this;
	};
	
	$.fn.showCells = function( visibleFramePosition ){
//		alert(visibleFramePosition.tableHeight);
//		alert(visibleFramePosition.tableWidth);
		this.lazyGrid.moveSpinner({
			'width' : visibleFramePosition.tableWidth,
			'offsetLeft' : visibleFramePosition.offsetLeft,
			'offsetTop' : visibleFramePosition.offsetTop
		});
		if( !this.lazyGrid.isDrawing ){
			this.lazyGrid.visibleFramePosition = $.extend( {}, this.lazyGrid.visibleFramePosition, visibleFramePosition );
		} else {
			this.lazyGrid.defferredDraw = true;
			this.lazyGrid.defferredVisibleFramePosition = $.extend( {}, this.lazyGrid.visibleFramePosition, visibleFramePosition );
		}
		if( this.find('.lazyTable-wrapper').length ){
			this.lazyGrid.scrollTable();
		} else {
			this.lazyGrid.reloadTable();
		}
	};
	
	$.fn.hideCells = function(){
		this.lazyGrid.destroy();
	}
	
	$(document).ready(function() {
		initLgContextMenu();
		createContextMenu();
	});

})(jQuery);