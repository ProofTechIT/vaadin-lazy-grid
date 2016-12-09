$.fn.fixedCells = function(data){
	if( typeof(data.operation) !== 'undefined' ){
		switch(data.operation){
			case 'delete':
				//data.tableId
				var fixedRowContainerWrapperId = '#lazy-table-fixed-row-wrapper-'+data.tableId;
				var fixedColContainerWrapperId = '#lazy-table-fixed-column-wrapper-'+data.tableId;
				//data.tableId = data.tableId.substring(10,data.tableId.length);
				if( $(fixedRowContainerWrapperId).length ){
					$(fixedRowContainerWrapperId).remove();
				}
				if( $(fixedColContainerWrapperId).length ){
					$(fixedColContainerWrapperId).remove();
				}
				return {};
				break;
			default:
				break;
		}
	}  
	if( data.hide ){
		var fixedRowContainerWrapperId = 'lazy-table-fixed-row-wrapper-'+data.tableId;
		var fixedColContainerWrapperId = 'lazy-table-fixed-column-wrapper-'+data.tableId;
		$('#'+fixedRowContainerWrapperId).remove();
		$('#'+fixedColContainerWrapperId).remove();
		return {};
	}
	var that = this; // this - элемент, к которому прицеплен плагин
	this.fixedColumns = {};
	this.fixedRows = {};
	this.displayedFixedColumns = [];
	this.displayedFixedRows = [];
	this.fixedColumnsRange = [];
	this.fixedRowsRange = [];
	this.additionalFixedColumns = [];
	this.additionalFixedRows = [];
	this.realColumns = [];
	this.realRows = [];
	this.needRebuild = false;
	this.tableServerCellRange = [];
	
	this.cellsFullOffsetLeft = [];
	this.cellsFullOffsetTop = [];
	
	this.fixedColumnsWidth = 0;
	this.fixedRowsHeight = 0;
		
	// переданное из Dus
	this.zoom = data.zoom || 1;
	this.tableId = data.tableId;
	this.meta = data.meta;
	this.cellsOffsetLeft = data.cellsOffsetLeft;
	this.cellsOffsetTop = data.cellsOffsetTop;
	this.tableOffsetLeft = data.tableOffsetLeft || 0;
	this.tableOffsetTop = data.tableOffsetTop || 0;
	this.tableWidth = data.tableWidth*that.zoom;
	this.tableHeight = data.tableHeight*that.zoom;
	this.cellsUnions = data.cellsUnions;
	this.viewportOffsetTop = data.viewportOffsetTop || 0;
	this.viewportOffsetLeft = data.viewportOffsetLeft || 0;
	this.realTableRange = data.realTableRange;
	this.tableCellRange = data.tableCellRange;
	this.realTableHeight = data.realTableHeight*that.zoom;
	this.realTableWidth = data.realTableWidth*that.zoom;
	
	/*
	 * vieportOffset - сдвиг видимой части таблицы относительно её верха или левой части. Аналог visibleFramePosition.offsetLeft или visibleFramePosition.offsetTop
	 * cellsOffset - массив сдвигов столбцов и строк обычных ячеек.
	 * tableOffset - сдвиги таблицы относительно рабочей области. Необходимо для позиционирования контейнеров для фиксированных ячеек
	 */
	this.init = function(){
		// Определение перечня фиксируемых столбцов\строк и нестандартных столбцов\строк
		$.each(that.meta.columnList, function(key, item){
			that.realColumns[item.index] = item;
			if( item.fixed ){
				that.fixedColumns[item.index] = item; 
			}
		});
		$.each(that.meta.rowList, function(key, item){
			that.realRows[item.index] = item;
			if( item.fixed ){
				that.fixedRows[item.index] = item; 
			}
		});
		
		// Определение показываемых фиксированных столбцов\строк
		for( var fixedColIndex in that.fixedColumns ){
			if( fixedColIndex < that.realTableRange.right ){
				that.displayedFixedColumns[fixedColIndex] = that.fixedColumns[fixedColIndex];
			}
		}
		
		for( var fixedRowIndex in that.fixedRows ){
			if( fixedRowIndex < that.realTableRange.bottom ){
				that.displayedFixedRows[fixedRowIndex] = that.fixedRows[fixedRowIndex];
			}
		}
		
		var tempOffset;
		var i;
		
		tempOffset = 0;
		for( i = 0; i < that.realTableRange.top; i++ ){
			tempOffset += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
		}
		
		for( i = that.realTableRange.top; i <= that.realTableRange.bottom; i++ ){
			that.cellsFullOffsetTop[i] = tempOffset;
			tempOffset += typeof(that.realRows[i]) !== 'undefined'? that.realRows[i].height : that.meta.defaultRow.height;
		}
		
		tempOffset = 0;
		for( i = 0; i < that.realTableRange.left; i++ ){
			tempOffset += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
		}
		
		for( i = that.realTableRange.left; i <= that.realTableRange.right; i++ ){
			that.cellsFullOffsetLeft[i] = tempOffset;
			tempOffset += typeof(that.realColumns[i]) !== 'undefined'? that.realColumns[i].width : that.meta.defaultColumn.width;
		}
		
		that.fixedCellsDraw();
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
	
	this.fixedCellsDraw = function(){
		var fixedRowIndex;
		var fixedColIndex;
		var ui = 0;
		var testElement;
		//var newCells = {};
		
		// Определение, нет ли на фиксированной строки объединённой ячейки, которая размаза по фиксированной и нефиксированной строкам
		that.additionalFixedRows = [];
		that.additionalFixedRows.length = 0;
		for( fixedRowIndex in that.displayedFixedRows ){
			for( ui = 0; ui < that.cellsUnions.union.length; ui++ ){
				unionid = that.cellsUnions.union[ui];
				if( 
					that.meta.cellSpanList[unionid].top <= parseInt(fixedRowIndex) &&
					that.meta.cellSpanList[unionid].bottom >= parseInt(fixedRowIndex)
				){
					for( var b1 = that.meta.cellSpanList[unionid].top; b1 <= that.meta.cellSpanList[unionid].bottom; b1++ ){
						that.displayedFixedRows[b1] = typeof(that.realRows[b1]) !== 'undefined'?
							that.realRows[b1] : that.meta.defaultRow;
						that.additionalFixedRows[b1] = that.meta.cellSpanList[unionid].top;
						that.additionalFixedRows['_'+that.meta.cellSpanList[unionid].top] = that.additionalFixedRows['_'+that.meta.cellSpanList[unionid].top] || [];
						that.additionalFixedRows['_'+that.meta.cellSpanList[unionid].top][b1] = that.displayedFixedRows[b1];
					}
				}
			}
		}
		
		// Определение, нет ли на фиксированном столбце объединённой ячейки, которая размаза по фиксированному и нефиксированному столбцу
		that.additionalFixedColumns = [];
		that.additionalFixedColumns.length = 0;
		for( fixedColIndex in that.displayedFixedColumns ){
			for( ui = 0; ui < that.cellsUnions.union.length; ui++ ){
				unionid = that.cellsUnions.union[ui];
				if( 
					that.meta.cellSpanList[unionid].left <= parseInt(fixedColIndex) &&
					that.meta.cellSpanList[unionid].right >= parseInt(fixedColIndex)
				){
					for( var b2 = that.meta.cellSpanList[unionid].left; b2 <= that.meta.cellSpanList[unionid].right; b2++ ){
						that.displayedFixedColumns[b2] = typeof(that.realColumns[b2]) !== 'undefined'?
							that.realColumns[b2] : that.meta.defaultColumn;
						that.additionalFixedColumns[b2] = that.meta.cellSpanList[unionid].left;
						that.additionalFixedColumns['_'+that.meta.cellSpanList[unionid].left] = that.additionalFixedColumns['_'+that.meta.cellSpanList[unionid].left] || [];
						that.additionalFixedColumns['_'+that.meta.cellSpanList[unionid].left][b2] = true;
					}
				}
			}
		}
		
		var fixedColContainerId = 'lazy-table-fixed-column-container-'+that.tableId;
		var fixedColContainerWrapperId = 'lazy-table-fixed-column-wrapper-'+that.tableId;
		var fixedRowContainerId = 'lazy-table-fixed-row-container-'+that.tableId;
		var fixedRowContainerWrapperId = 'lazy-table-fixed-row-wrapper-'+that.tableId;
		var fixedColWrapper = document.getElementById('lazy-table-fixed-column-container-'+that.tableId);
		var fixedRowWrapper = document.getElementById('lazy-table-fixed-row-container-'+that.tableId);
		var showedFixedColumns = [];
		var showedFixedRows = [];
			
		var fixedOffsetLeft = 0;
		var fixedOffsetTop = 0;
		var fixedColStr = '';
		var fixedRowStr = '';
		var innerCell = '';
		var additionalRanges = {
			top: -1,
			bottom: -1,
			left: -1,
			right: -1
		};
		var unionId;
		var heightS = 0;
		var widthS = 0;
		
		var tempFixedColIndex;
		var tempFixedRowIndex;
		
		var ka;
		var kk;
		var fuIndex;
		var h;
		var w;
		//// Определение фиксированных строк
		for( fixedRowIndex in that.displayedFixedRows ){
			if( typeof(that.displayedFixedRows[fixedRowIndex]) === 'object' ){ // <- IE fix
				if( typeof(that.cellsFullOffsetTop[fixedRowIndex]) !== 'undefined' ){
					testElement = that.cellsFullOffsetTop[fixedRowIndex];
				} else {
					testElement = false;
				}
				if( testElement !== false ){
					if( (testElement - that.viewportOffsetTop) < fixedOffsetTop ){
						showedFixedRows[fixedRowIndex] = that.displayedFixedRows[fixedRowIndex];
					}
				} else {
					showedFixedRows[fixedRowIndex] = that.displayedFixedRows[fixedRowIndex];
				}
				fixedOffsetTop += typeof(that.realRows[fixedRowIndex]) !== 'undefined'? 
					that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
			}
		}
		
		if( showedFixedRows.length ){
			for( fixedRowIndex in showedFixedRows ){
				if( typeof(that.additionalFixedRows['_'+fixedRowIndex]) !== 'undefined' ){ // <- IE fix
					for( fuIndex in that.additionalFixedRows['_'+fixedRowIndex] ){
						if( typeof(that.additionalFixedRows['_'+fixedRowIndex][fuIndex]) === 'object' ){ // <- IE fix
							if( typeof(showedFixedRows[fuIndex]) === 'undefined' ){
								showedFixedRows[fuIndex] = that.additionalFixedRows['_'+fixedRowIndex][fuIndex];
							}
						}
					}
				}
			}
		}
		
		///// Определение фиксированных колонок
		for( fixedColIndex in that.displayedFixedColumns ){
			if( typeof(that.displayedFixedColumns[fixedColIndex]) === 'object' ){ // <- IE fix
				if( typeof(that.cellsFullOffsetLeft[fixedColIndex]) !== 'undefined' ){
					testElement = that.cellsFullOffsetLeft[fixedColIndex];
				} else {
					testElement = false;
				}
				if( testElement !== false ){
					if( (testElement - that.viewportOffsetLeft) < fixedOffsetLeft ){
						showedFixedColumns[fixedColIndex] = that.displayedFixedColumns[fixedColIndex];
					}
				} else {
					showedFixedColumns[fixedColIndex] = that.displayedFixedColumns[fixedColIndex];
				}
				fixedOffsetLeft += typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
					that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
			}
		}
		
		if( showedFixedColumns.length ){
			for( fixedColIndex in showedFixedColumns ){
				if( typeof(that.additionalFixedColumns['_'+fixedColIndex]) !== 'undefined' ){ // <- IE fix
					for( fuIndex in that.additionalFixedColumns['_'+fixedColIndex] ){
						if( typeof(that.additionalFixedColumns['_'+fixedColIndex][fuIndex]) === 'object' ){ // <- IE fix
							if( typeof(showedFixedRows[fuIndex]) === 'undefined' ){
								showedFixedRows[fuIndex] = that.additionalFixedColumns['_'+fixedColIndex][fuIndex];
							}
						}
					}
				}
			}
		}
		
		// Удаление лишних ячеек из фиксированной строки
		$('#lazy-table-fixed-row-container-'+that.tableId).find('.cell-rowfixed').each(function(key, item){
			var itemRow = $(item).data('row');
			var itemCol = $(item).data('col');
			if( 
				itemCol < that.realTableRange.left ||
				itemCol > that.realTableRange.right || 
				typeof(showedFixedRows[itemRow]) === 'undefined'
			){
				var unionid = $(item).find('.cell-inner').data('unionid');
				if( typeof(unionid) !== 'undefined' ){
					if(typeof(that.meta.cellSpanList[unionid]) !== 'undefined'){
						if( 
							that.meta.cellSpanList[unionid].bottom < that.realTableRange.top ||
							that.meta.cellSpanList[unionid].right < that.realTableRange.left
						){
							if( $('#'+'r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed').length ){
								fixedRowWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed'));	
							}
						}
					} else {
						if( $('#'+'r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed').length ){
							fixedRowWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed'));	
						}
					}
				} else{
					if( $('#'+'r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed').length ){
						fixedRowWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed'));	
					}
				}
			}
		});
		
		var arrFixedRowCells = [];
		var arrFixedColCells = [];
		var rangeFixedRowCells = {
			left: -1,
			top: -1,
			right: -1,
			bottom: -1
		};
		var rangeFixedColCells = {
			left: -1,
			top: -1,
			right: -1,
			bottom: -1
		};
		
		// отрисовка фиксированных ячеек(пустых) в строках
		if( showedFixedRows.length ){
			if( !$('#'+fixedRowContainerId).length ){
				$('<div/>',{
					'id': fixedRowContainerWrapperId,
					'class': 'lazy-table-fixed-row-wrapper',
					'css': {
						'position': 'absolute'
					}
				}).appendTo(that);
				
				$('<div/>',{
					'id': fixedRowContainerId,
					'class': 'lazy-table-fixed-row-container',
					'css': {
						'position': 'absolute',
						'top': 0,
						'width' : that.realTableWidth
					}
				}).appendTo('#'+fixedRowContainerWrapperId);
				$('#'+fixedRowContainerId).on('click', function(e){
					that.cellClickEvent(e);
				});
			}
			$('#'+fixedRowContainerWrapperId).css({
				'width' : that.tableWidth,
				'max-height' : that.tableHeight,
				'top': that.tableOffsetTop+'px',
				'left': that.tableOffsetLeft+'px'
			});
			$('#'+fixedRowContainerId).css({
				'left': -that.viewportOffsetLeft
			});
			$('#'+fixedRowContainerWrapperId).show();
			offsetLeft = that.cellsOffsetLeft[that.tableCellRange.left];
			offsetTop = 0;
			
			for( fixedRowIndex in showedFixedRows ){
				if( typeof(showedFixedRows[fixedRowIndex]) === 'object' ){
					additionalRanges.top = parseInt(fixedRowIndex);
					additionalRanges.bottom = parseInt(fixedRowIndex);
					for( fixedColIndex = that.tableCellRange.left; fixedColIndex <= that.tableCellRange.right; fixedColIndex++ ){
						fixedRowIndex = parseInt(fixedRowIndex);
						
						unionid = -1;
						fixedRowItemId = 'r'+fixedRowIndex+'c'+fixedColIndex+'-'+that.tableId+'-rowfixed';
						elementCellFixed = $('#'+fixedRowItemId);
						width = typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
							that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
						innerCell = '<div class="cell-inner" data-row="'+fixedRowIndex+'"' +
									' data-col="'+fixedColIndex+'"' + 'style="width:'+ width +'px;height:'+showedFixedRows[fixedRowIndex].height+'px;"></div>';
						
						unionid = that.getUnionId(fixedRowIndex, fixedColIndex);
						if( !elementCellFixed.find('.cell-filled').length ){
							that.needRebuild = true;
							if( additionalRanges.left === -1 ){
								if( unionid === -1 ){
									additionalRanges.left = fixedColIndex;
								}else if( !$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-rowfixed').length ) {
									additionalRanges.left = that.meta.cellSpanList[unionid].left;
									tempFixedColIndex = fixedColIndex;
									fixedColIndex = that.meta.cellSpanList[unionid].left;
									for( ka = fixedColIndex; ka < tempFixedColIndex; ka++ ){
										offsetLeft -= typeof(that.realColumns[fixedColIndex]) !== 'undefined'? 
											that.realColumns[fixedColIndex].width : that.meta.defaultColumn.width;
									}
								}
							}
							additionalRanges.right = fixedColIndex;
							
							if( 
								rangeFixedRowCells.left > fixedColIndex ||
								rangeFixedRowCells.left == -1
							){
								rangeFixedRowCells.left = fixedColIndex;
							}
							
							if( 
								rangeFixedRowCells.right < fixedColIndex ||
								rangeFixedRowCells.right == -1
							){
								rangeFixedRowCells.right = fixedColIndex;
							}
							
							if( 
								rangeFixedRowCells.top > fixedRowIndex ||
								rangeFixedRowCells.top == -1
							){
								rangeFixedRowCells.top = fixedRowIndex;
							}
							
							if( 
								rangeFixedRowCells.bottom < fixedRowIndex ||
								rangeFixedRowCells.bottom == -1
							){
								rangeFixedRowCells.bottom = fixedRowIndex;
							}							
						}
						if( !elementCellFixed.length ){
							fixedRowStr = '<div id="'+ fixedRowItemId +'"' + ' class="'+'cell cell-rowfixed r'+fixedRowIndex+' c'+fixedColIndex+'"' + 
									' data-row="'+fixedRowIndex+'"' +
									' data-col="'+fixedColIndex+'"' + 
									'style="width:'+ width +'px;height:'+showedFixedRows[fixedRowIndex].height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;">'+
									innerCell+
									'</div>';
							$('#'+fixedRowContainerId).append(fixedRowStr);
							if( unionid !== -1  ){
								$('#'+fixedRowItemId).data('unionid', unionid);
								$('#'+fixedRowItemId).find('.cell-inner').data('unionid', unionid);
								if( 
									that.meta.cellSpanList[unionid].left === parseInt(fixedColIndex) && 
									that.meta.cellSpanList[unionid].top === parseInt(fixedRowIndex)
								){
									for( w = that.meta.cellSpanList[unionid].left; w <= that.meta.cellSpanList[unionid].right; w++ ){
										widthS += typeof(that.realColumns[w]) !== 'undefined'? 
											that.realColumns[w].width : that.meta.defaultColumn.width;
									}
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-rowfixed').css({
										'width': widthS+'px',
										'z-index' : 2
									});
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-rowfixed'+' .cell-inner').css('width', widthS+'px');
									widthS = 0;
									
									for( h = that.meta.cellSpanList[unionid].top; h <= that.meta.cellSpanList[unionid].bottom; h++ ){
										heightS += typeof(that.realRows[h]) !== 'undefined'? 
											that.realRows[h].height : that.meta.defaultRow.height;
									}
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-rowfixed').css('height', heightS+'px');
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-rowfixed'+' .cell-inner').css('height', heightS+'px');
									heightS = 0;
								}
							}
						}
						offsetLeft += width;
					}
					offsetTop += showedFixedRows[fixedRowIndex].height;
					offsetLeft = that.cellsOffsetLeft[that.tableCellRange.left];
					if( 
						rangeFixedRowCells.top != -1 && 
						rangeFixedRowCells.left != -1 && 
						rangeFixedRowCells.right != -1 && 
						rangeFixedRowCells.bottom != -1
					){
						that.tableServerCellRange.push({
							top: rangeFixedRowCells.top,
							bottom: rangeFixedRowCells.bottom,
							left: rangeFixedRowCells.left,
							right: rangeFixedRowCells.right
						});
					}
				}
			}
			that.fixedRowsHeight = offsetTop*that.zoom;
			$('#'+fixedRowContainerId).css('height', that.fixedRowsHeight);
			$('#'+fixedRowContainerWrapperId).css('height', that.fixedRowsHeight);
		}
		
		// Удаление лишних ячеек из фиксированного столбца
		$('#lazy-table-fixed-column-container-'+that.tableId).find('.cell-colfixed').each(function(key, item){
			var itemRow = $(item).data('row');
			var itemCol = $(item).data('col');
			if( 
				itemRow < that.realTableRange.top || 
				itemRow > that.realTableRange.bottom ||
				typeof(showedFixedColumns[itemCol]) === 'undefined'
			){
				var unionid = $(item).find('.cell-inner').data('unionid');
				if( typeof(unionid) !== 'undefined' ){
					if( typeof(that.meta.cellSpanList[unionid]) !== 'undefined' ){
						if( 
							that.meta.cellSpanList[unionid].bottom < that.realTableRange.top ||
							that.meta.cellSpanList[unionid].right < that.realTableRange.left
						){
							if( $('#'+'r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed').length ){
								fixedColWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableId+'-colfixed'));
							}
						}
					} else {
						if( $('#'+'r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed').length ){
							fixedColWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableId+'-colfixed'));
						}
					}
				} else{
					if( $('#'+'r'+itemRow+'c'+itemCol+'-'+that.tableId+'-rowfixed').length ){
						fixedColWrapper.removeChild(document.getElementById('r'+itemRow+'c'+itemCol+'-'+that.tableId+'-colfixed'));
					}
				}
			}
		});
		
		additionalRanges = {
			top: -1,
			bottom: -1,
			left: -1,
			right: -1
		};
		// отрисовка фиксированных ячеек(пустых) в столбцах
		if( showedFixedColumns.length ){
			if( !$('#'+fixedColContainerId).length ){
				$('<div/>',{
					'id': fixedColContainerWrapperId,
					'class': 'lazy-table-fixed-column-wrapper',
					'css': {
						'position': 'absolute'
					}
				}).appendTo(that);
				
				$('<div/>',{
					'id': fixedColContainerId,
					'class': 'lazy-table-fixed-column-container',
					'css': {
						'position': 'absolute',
						'left': 0,
						'height' : that.realTableHeight
					}
				}).appendTo('#'+fixedColContainerWrapperId);
				
				$('#'+fixedColContainerId).on('click', function(e){
					that.cellClickEvent(e);
				});
			} 
			$('#'+fixedColContainerWrapperId).css({
				'height' : that.tableHeight,
				'max-width' : that.tableWidth,
				'top': that.tableOffsetTop+'px',
				'left': that.tableOffsetLeft+'px',
			});
			$('#'+fixedColContainerId).css({
				'top': -that.viewportOffsetTop
			});
			$('#'+fixedColContainerWrapperId).show();
			offsetLeft = 0;
			offsetTop = that.cellsOffsetTop[that.tableCellRange.top];
			
			for( fixedColIndex in showedFixedColumns ){
				if( typeof(showedFixedColumns[fixedColIndex]) === 'object' ){
					additionalRanges.left = parseInt(fixedColIndex);
					additionalRanges.right = parseInt(fixedColIndex);
					for( fixedRowIndex = that.tableCellRange.top; fixedRowIndex <= that.tableCellRange.bottom; fixedRowIndex++ ){
						fixedColIndex = parseInt(fixedColIndex);
						
						unionid = -1;
						fixedColItemId = 'r'+fixedRowIndex+'c'+fixedColIndex+'-'+that.tableId+'-colfixed';
						elementCellFixed = $('#'+fixedColItemId);
						height = typeof(that.realRows[fixedRowIndex]) !== 'undefined'? 
							that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
						innerCell = '<div class="cell-inner" data-row="'+fixedRowIndex+'"' +
									' data-col="'+fixedColIndex+'"' + 'style="width:'+ showedFixedColumns[fixedColIndex].width +'px;height:'+height+'px;"></div>';
						
						unionid = that.getUnionId(fixedRowIndex, fixedColIndex);
						if( !elementCellFixed.find('.cell-filled').length ){
							that.needRebuild = true;
							if( additionalRanges.top === -1 ){
								if( unionid === -1 ){
									additionalRanges.top = fixedRowIndex;
								}else if( !$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-rowfixed').length ){
									additionalRanges.top = that.meta.cellSpanList[unionid].top;
									tempFixedRowIndex = fixedRowIndex;
									fixedRowIndex = that.meta.cellSpanList[unionid].top;
									for( ka = fixedRowIndex; ka < tempFixedRowIndex; ka++ ){
										offsetTop -= typeof(that.realRows[fixedRowIndex]) !== 'undefined'? 
											that.realRows[fixedRowIndex].height : that.meta.defaultRow.height;
									}
								}
							}
							additionalRanges.bottom = fixedRowIndex;
							
							if( 
								rangeFixedColCells.left > fixedColIndex ||
								rangeFixedColCells.left == -1
							){
								rangeFixedColCells.left = fixedColIndex;
							}
							
							if( 
								rangeFixedColCells.right < fixedColIndex ||
								rangeFixedColCells.right == -1
							){
								rangeFixedColCells.right = fixedColIndex;
							}
							
							if( 
								rangeFixedColCells.top > fixedRowIndex ||
								rangeFixedColCells.top == -1
							){
								rangeFixedColCells.top = fixedRowIndex;
							}
							
							if( 
								rangeFixedColCells.bottom < fixedRowIndex ||
								rangeFixedColCells.bottom == -1
							){
								rangeFixedColCells.bottom = fixedRowIndex;
							}
						}
						if( !elementCellFixed.length ){
							/*newCells[fixedRowIndex] = typeof(newCells[fixedRowIndex]) === 'undefined'? [] : newCells[fixedRowIndex];
							newCells[fixedRowIndex].push(fixedColIndex);*/
							
							fixedColStr = '<div id="'+ fixedColItemId +'"' + ' class="'+'cell cell-colfixed r'+fixedRowIndex+' c'+fixedColIndex+'"' + 
									' data-row="'+fixedRowIndex+'"' +
									' data-col="'+fixedColIndex+'"' + 'style="width:'+ showedFixedColumns[fixedColIndex].width +'px;height:'+height+'px;top:'+offsetTop+'px;left:'+offsetLeft+'px;">'+
									innerCell+
									'</div>';
							$('#'+fixedColContainerId).append(fixedColStr);
							if( unionid !== -1  ){
								$('#'+fixedColItemId).data('unionid', unionid);
								$('#'+fixedColItemId).find('.cell-inner').data('unionid', unionid);
								if( that.meta.cellSpanList[unionid].left === parseInt(fixedColIndex) && 
									that.meta.cellSpanList[unionid].top === parseInt(fixedRowIndex)
								){
									for( h = that.meta.cellSpanList[unionid].top; h <= that.meta.cellSpanList[unionid].bottom; h++ ){
										heightS += typeof(that.realRows[h]) !== 'undefined'? 
											that.realRows[h].height : that.meta.defaultRow.height;
									}
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-colfixed').css({
										'height': heightS+'px',
										'z-index' : 2
									});
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-colfixed'+' .cell-inner').css('height', heightS+'px');
									heightS = 0;
									
									for( w = that.meta.cellSpanList[unionid].left; w <= that.meta.cellSpanList[unionid].right; w++ ){
										widthS += typeof(that.realColumns[w]) !== 'undefined'? 
											that.realColumns[w].width : that.meta.defaultColumn.width;
									}
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-colfixed').css('width', widthS+'px');
									$('#'+'r'+that.meta.cellSpanList[unionid].top+'c'+that.meta.cellSpanList[unionid].left+'-'+that.tableId+'-colfixed'+' .cell-inner').css('width', widthS+'px');
									widthS = 0;
								}
							}
						}
						offsetTop += height;
					}
					offsetLeft += showedFixedColumns[fixedColIndex].width;
					offsetTop = that.cellsOffsetTop[that.tableCellRange.top];
					if( 
						rangeFixedColCells.top != -1 && 
						rangeFixedColCells.left != -1 && 
						rangeFixedColCells.right != -1 && 
						rangeFixedColCells.bottom != -1
					){
						that.tableServerCellRange.push({
							top: rangeFixedColCells.top,
							bottom: rangeFixedColCells.bottom,
							left: rangeFixedColCells.left,
							right: rangeFixedColCells.right
						});
					}
					
				}
			}
			that.fixedColumnsWidth = offsetLeft*that.zoom;
			$('#'+fixedColContainerId).css('width', that.fixedColumnsWidth);
			$('#'+fixedColContainerWrapperId).css('width', that.fixedColumnsWidth);
		}
		
		if( showedFixedRows.length === 0 && $('#'+fixedRowContainerWrapperId).length ){
			$('#'+fixedRowContainerWrapperId).hide();
		}
		
		if( showedFixedColumns.length === 0 && $('#'+fixedColContainerWrapperId).length ){
			$('#'+fixedColContainerWrapperId).hide();
		}
	};
	
	this.cellClickEvent = function(e){
		target = e.target || e.srcElement;
		var x = e.clientX, y = e.clientY,
		elementMouseIsOver = document.elementFromPoint(x, y);
		cellElement = getLgCellElement($(elementMouseIsOver));
		if( cellElement.hasClass('lazyTable-tooltip') ){
			cellElement.hide();
			x = e.clientX, y = e.clientY,
			elementMouseIsOver = document.elementFromPoint(x, y);
			cellElement = $(elementMouseIsOver);
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
		if( !cellElement.find('.cell-edit').length && !cellElement.hasClass('cell-edit') && !cellElement.hasClass('cell-disabled') && !cellElement.hasClass('cell-under-edit')){
			$(that).trigger('clickFixedCell', [cellElement]);
		}
	};
	
	this.init();
	return {
		cellRanges: 	that.tableServerCellRange,
		overlapLeft: 	that.fixedColumnsWidth,
		overlapTop:		that.fixedRowsHeight
	};
};