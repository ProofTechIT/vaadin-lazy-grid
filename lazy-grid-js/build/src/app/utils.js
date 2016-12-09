function isLgCellEditable(cell) {
	return cell.contentType.editPluginName !== 'LG_CELL_CONTENT_LABEL' && cell.editable;
}

function getLgCellElement(element) {
	return element.hasClass('cell-inner') ? element : element.parents('.cell-inner');
}

function getLgCellId(cell,that) {
	return '#r'+cell.rowIndex+'c'+cell.colIndex+'-'+that.tableIdSalt;
}

function getLgCellElementByCoordinates(rowIndex, colIndex, that){
	return $('#r'+rowIndex+'c'+colIndex+'-'+that.tableIdSalt);
}

function getLgNextElement(rowIndex, colIndex, that){
	cellElement = $('#r'+rowIndex+'c'+(colIndex+1)+'-'+that.tableIdSalt);
	return cellElement;
};

function getLgPreviousElement(rowIndex, colIndex, that){
	cellElement = $('#r'+rowIndex+'c'+(colIndex-1)+'-'+that.tableIdSalt);
	return cellElement;
};

function getLgElementUnder(rowIndex, colIndex, that){
	cellElement = $('#r'+(rowIndex+1)+'c'+colIndex+'-'+that.tableIdSalt);
	return cellElement;
};

function getLgElementAbove(rowIndex, colIndex, that){
	cellElement = $('#r'+(rowIndex-1)+'c'+colIndex+'-'+that.tableIdSalt);
	return cellElement;
};

function isCellDataSet(rowIndex, colIndex, that){
	if( typeof(that.data[rowIndex]) !== 'undefined' ){
		if( typeof(that.data[rowIndex][colIndex]) !== 'undefined' ){
			return true;
		}
	}
	return false;
};

function getURLParameters(paramName)
{
    var sURL = window.document.URL.toString();
    if (sURL.indexOf("?") > 0)
    {
        var arrParams = sURL.split("?");
        var arrURLParams = arrParams[1].split("&");
        var arrParamNames = new Array(arrURLParams.length);
        var arrParamValues = new Array(arrURLParams.length);

        var i = 0;
        for (i = 0; i<arrURLParams.length; i++)
        {
            var sParam =  arrURLParams[i].split("=");
            arrParamNames[i] = sParam[0];
            if (sParam[1] != "")
                arrParamValues[i] = unescape(sParam[1]);
            else
                arrParamValues[i] = "No Value";
        }

        for (i=0; i<arrURLParams.length; i++)
        {
            if (arrParamNames[i] == paramName)
            {
                //alert("Parameter:" + arrParamValues[i]);
                return arrParamValues[i];
            }
        }
        return 1;
    }
	return 1;
}