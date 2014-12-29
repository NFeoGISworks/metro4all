/*******************************************************************************
 * Project:  Metro Access
 * Purpose:  Routing in subway for disabled.
 * Author:   Baryshnikov Dmitriy (aka Bishop), polimax@mail.ru
 ******************************************************************************
*   Copyright (C) 2013 NextGIS
*
*    This program is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 3 of the License, or
*    (at your option) any later version.
*
*    This program is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*******************************************************************************/
package com.nextgis.metroaccess;

import java.io.File;
import java.util.List;

import com.nextgis.metroaccess.data.BarrierItem;
import com.nextgis.metroaccess.data.RouteItem;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Log;
import android.util.TypedValue;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.View.OnClickListener;
import android.widget.BaseExpandableListAdapter;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.TextView;

import static com.nextgis.metroaccess.Constants.*;

public class RouteExpandableListAdapter extends BaseExpandableListAdapter {
	protected Context mContext;
	protected List <RouteItem> maRouteList;
	
	protected LayoutInflater mInfalInflater;
	
	public RouteExpandableListAdapter(Context c, List<RouteItem> RouteList) {
		mContext = c;
		maRouteList = RouteList;
		
		mInfalInflater = (LayoutInflater) mContext.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }
	
	@Override
	public Object getChild(int groupPosition, int childPosition) {
		RouteItem rit = maRouteList.get(groupPosition);
		if(rit != null)
			return rit.GetProblems().get(childPosition);
		return null;
	}

	@Override
	public long getChildId(int groupPosition, int childPosition) {
		BarrierItem bit = (BarrierItem)getChild(groupPosition, childPosition);
		if(bit != null)
			return bit.GetId();
		return -1;
	}

	@Override
	public View getChildView(int groupPosition, int childPosition, boolean isLastChild, View convertView, ViewGroup parent) {
		if (convertView == null) {
			convertView = mInfalInflater.inflate(R.layout.barrier_row_layout, null);
		}
		
		RouteItem rit = (RouteItem)getGroup(groupPosition);
		BarrierItem bit = (BarrierItem)getChild(groupPosition, childPosition);
		TextView item = (TextView) convertView.findViewById(R.id.txBarrierName);
		//
		if(bit.IsProblem()){
			item.setTextColor(Color.RED);
		}
		else{
			TypedValue tv = new TypedValue();
			mContext.getTheme().resolveAttribute(android.R.attr.textColorSecondary, tv, true);
			item.setTextColor(mContext.getResources().getColor(tv.resourceId));	
		}			
		//
		item.setText(bit.GetName());
		
		ImageView ivIcon = (ImageView)convertView.findViewById(R.id.ivIcon);
		// set data to display
		String sRouteDataPath = MainActivity.GetGraph().GetCurrentRouteDataPath();
	    File imgFile = new File(sRouteDataPath + "/icons", "" + rit.GetLine() + "8.png");		
		Log.d(TAG, imgFile.getPath());
		if(rit.GetType() != 7 && imgFile.exists()){
		    Bitmap myBitmap = BitmapFactory.decodeFile(imgFile.getAbsolutePath());
		    ivIcon.setImageBitmap(myBitmap);
		    ivIcon.setVisibility(View.VISIBLE);
		}	
		else{
			ivIcon.setVisibility(View.INVISIBLE);
		}		

		return convertView;
	}

	@Override
	public int getChildrenCount(int groupPosition) {
		RouteItem rit = maRouteList.get(groupPosition);
		if(rit != null)
			return rit.GetProblems().size();
		return 0;
	}

	@Override
	public Object getGroup(int groupPosition) {
		return maRouteList.get(groupPosition);
	}

	@Override
	public int getGroupCount() {
		return maRouteList.size();
	}

	@Override
	public long getGroupId(int groupPosition) {
		RouteItem rit = (RouteItem)maRouteList.get(groupPosition);
		if(rit != null)
			return rit.GetId();
		return -1;
	}

	@Override
	public View getGroupView(int groupPosition, boolean isExpanded, View convertView, ViewGroup parent) {
		final RouteItem entry = (RouteItem) getGroup(groupPosition);
		if (convertView == null) {
			convertView = mInfalInflater.inflate(R.layout.station_row_layout, null);
		}
		
		TextView item = (TextView) convertView.findViewById(R.id.tvStationName);
		item.setText(entry.GetName());
		
		TextView subitem = (TextView) convertView.findViewById(R.id.tvBarriersExist);
		if(entry.GetProblems().size() > 0){
			subitem.setVisibility(View.VISIBLE);
			boolean bConflict = false;
			for(BarrierItem bit : entry.GetProblems()){
				if(bit.IsProblem()){
					bConflict = true;
					break;
				}
			}
			
			if(entry.GetId() == -1){
				subitem.setText(mContext.getString(R.string.sSummaryClick));
			}
			else{
				subitem.setText(mContext.getString(R.string.sBarriersExist));
			}			
			
			if(bConflict){
				// + " " + mContext.getString(R.string.sBarriersConflict));
				subitem.setTextColor(Color.RED);
			}
			else{
				TypedValue tv = new TypedValue();
				mContext.getTheme().resolveAttribute(android.R.attr.textColorSecondary, tv, true);
				subitem.setTextColor(mContext.getResources().getColor(tv.resourceId));	
			}
		}
		else{
			subitem.setVisibility(View.INVISIBLE);
		}
		
		ImageView ivIcon = (ImageView)convertView.findViewById(R.id.ivIcon);
		// set data to display
		String sRouteDataPath = MainActivity.GetGraph().GetCurrentRouteDataPath();
	    File imgFile = new File(sRouteDataPath + "/icons", "" + entry.GetLine() + "" + entry.GetType() + ".png");		
		Log.d(TAG, imgFile.getPath());
		if(imgFile.exists()){
		    Bitmap myBitmap = BitmapFactory.decodeFile(imgFile.getAbsolutePath());
		    ivIcon.setImageBitmap(myBitmap);
		    ivIcon.setVisibility(View.VISIBLE);
		}
		else{
			ivIcon.setVisibility(View.INVISIBLE);
		}
		
		ImageButton showSchemaButton = (ImageButton) convertView.findViewById(R.id.show_sheme);
		showSchemaButton.setFocusable(false);
		final File schemaFile = new File(sRouteDataPath + "/schemes", "" + entry.GetNode() + ".png");		
		if(schemaFile.exists()){
			showSchemaButton.setOnClickListener(new OnClickListener() {
 
				public void onClick(View arg0) {
				    try {
				    	Log.d(TAG, schemaFile.getPath());
                        ((Analytics) ((Activity) mContext).getApplication()).addEvent(Analytics.SCREEN_ROUTING, Analytics.BTN_LAYOUT, Analytics.ACTION_ITEM);
				    	
				    	Bundle bundle = new Bundle();
				    	bundle.putString(Constants.PARAM_SCHEME_PATH, schemaFile.getPath());
                        bundle.putInt(PARAM_SEL_STATION_ID, entry.GetId());
				        Intent intentView = new Intent(mContext, com.nextgis.metroaccess.StationImageView.class);
				    	
				    	intentView.putExtras(bundle);
				    	
				    	mContext.startActivity(intentView);
				    } catch (ActivityNotFoundException e) {
				        Log.e(TAG, "Call failed", e);
				    }
				}
	 
			});
			showSchemaButton.setVisibility(View.VISIBLE);
		}
		else{
			showSchemaButton.setVisibility(View.INVISIBLE);
		}

		return convertView;
	}

	@Override
	public boolean hasStableIds() {
		return true;
	}

	@Override
	public boolean isChildSelectable(int groupPosition, int childPosition) {
		return false;
	}
}
