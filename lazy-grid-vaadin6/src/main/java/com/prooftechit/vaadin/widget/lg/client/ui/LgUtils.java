package com.prooftechit.vaadin.widget.lg.client.ui;

public class LgUtils {

	public static LgElementFrame calculateIntersectionFrame(LgElementFrame a, LgElementFrame b){
		int ax = a.getLeft();
		int ay = a.getTop();
		int ax1 = a.getLeft() + a.getWidth();
		int ay1 = a.getTop() + a.getHeight();

		int bx = b.getLeft();
		int by = b.getTop();
		int bx1 = b.getLeft() + b.getWidth();
		int by1 = b.getTop() + b.getHeight();;

		// Если пересечения с видимой областью контейнера нет
		if (ay > by1 || ay1 < by || ax > bx1 || ax1 < bx) {
			return null;
		}

		int vOffsetLeft = a.getLeft() >= b.getLeft() ? a.getLeft() - b.getLeft() : 0;
		int vOffsetRight = ax1 <= bx1 ? bx1 - ax1 : 0;
				
		int vOffsetTop = a.getTop() >= b.getTop() ? a.getTop() - b.getTop() : 0;
		int vOffsetButtom = ay1 <= by1 ? by1 - ay1 : 0;
		
		int vWidth = b.getWidth() - vOffsetLeft - vOffsetRight;
		int vHeight = b.getHeight() - vOffsetTop - vOffsetButtom;
		
		LgElementFrame result = new LgElementFrame();		
		result.setLeft(vOffsetLeft);
		result.setTop(vOffsetTop);
		result.setWidth(vWidth);
		result.setHeight(vHeight);
		
		return result;
	}
	
	public static void main(String args[]){
		LgElementFrame containerFrame = new LgElementFrame();
		containerFrame.setLeft(0);
		containerFrame.setTop(53);
		containerFrame.setHeight(585);
		containerFrame.setWidth(1867);

		
		
		LgElementFrame elementFrame = new LgElementFrame();
		elementFrame.setLeft(10);
		elementFrame.setTop(10);
		elementFrame.setHeight(250);
		elementFrame.setWidth(1000);
		
		LgElementFrame intarsection = calculateIntersectionFrame(containerFrame, elementFrame);
		System.out.println(intarsection.getLeft());
		System.out.println(intarsection.getTop());
		System.out.println(intarsection.getWidth());
		System.out.println(intarsection.getHeight());
		
		System.out.println();
		
		intarsection = calculateIntersectionFrame(intarsection, intarsection);
		System.out.println(intarsection.getLeft());
		System.out.println(intarsection.getTop());
		System.out.println(intarsection.getWidth());
		System.out.println(intarsection.getHeight());		
	}
	
}
