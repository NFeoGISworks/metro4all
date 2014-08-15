/******************************************************************************
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
 ****************************************************************************/
package com.nextgis.metroaccess;

import android.graphics.Rect;
import android.util.DisplayMetrics;
import android.view.ViewTreeObserver;
import com.actionbarsherlock.app.SherlockFragment;
import com.nextgis.metroaccess.data.PortalItem;

import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ExpandableListView;
import android.widget.TextView;
import android.widget.ExpandableListView.OnChildClickListener;
import android.widget.ExpandableListView.OnGroupClickListener;
import android.content.Context;
import android.os.Bundle;

public class AlphabeticalStationListFragment extends SherlockFragment {
	protected ExpandableListView m_oExpListView;
	protected StationIndexedExpandableListAdapter m_oExpListAdapter;
	
	protected TextView m_tvNotes;
	
	@Override
	public View onCreateView(LayoutInflater inflater, ViewGroup container,
			Bundle savedInstanceState) {

		this.setRetainInstance(true);

		SelectStationActivity parentActivity = (SelectStationActivity) getSherlockActivity();
		View view = inflater.inflate(R.layout.alphabetical_stationlist_fragment, container, false);
		
        m_tvNotes = (TextView)view.findViewById(R.id.tvNotes);        
        
		if( m_tvNotes != null){
			if(!parentActivity.HasLimits()){
				m_tvNotes.setVisibility(View.INVISIBLE);
			}
		}

		m_oExpListView = (ExpandableListView) view.findViewById(R.id.lvStationList);
		m_oExpListAdapter = new StationIndexedExpandableListAdapter(parentActivity, parentActivity.GetStationList());
		m_oExpListAdapter.onInit();
		m_oExpListView.setAdapter(m_oExpListAdapter);
		m_oExpListView.setFastScrollEnabled(true);
		m_oExpListView.setGroupIndicator(null);

		m_oExpListView.setOnChildClickListener(new OnChildClickListener() {

			public boolean onChildClick(ExpandableListView parent, View v, int groupPosition, int childPosition, long id) {
				final PortalItem selected = (PortalItem) m_oExpListAdapter.getChild(groupPosition, childPosition);
				SelectStationActivity parentActivity = (SelectStationActivity) getSherlockActivity();
				parentActivity.Finish(selected.GetStationId(), selected.GetId());
				return true;
			}
		});
		
		m_oExpListView.setOnGroupClickListener(new OnGroupClickListener() {

			@Override
			public boolean onGroupClick(ExpandableListView parent, View v, int groupPosition, long id) {
				InputMethodManager imm = (InputMethodManager) getActivity().getApplicationContext().getSystemService(Context.INPUT_METHOD_SERVICE);
				imm.hideSoftInputFromWindow(v.getWindowToken(), InputMethodManager.HIDE_NOT_ALWAYS);				
				return false;
			}			
		});

		EditText stationFilterEdit = (EditText) view.findViewById(R.id.etStationFilterEdit);
		TextWatcher searchTextWatcher = new TextWatcher() {
			@Override
			public void onTextChanged(CharSequence s, int start, int before, int count) {
				// ignore
			}

			@Override
			public void beforeTextChanged(CharSequence s, int start, int count, int after) {
				// ignore
			}

			@Override
			public void afterTextChanged(Editable s) {
				Log.d(MainActivity.TAG, "*** Search value changed: " + s.toString());
				m_oExpListAdapter.getFilter().filter(s.toString());
			}
		};
		stationFilterEdit.addTextChangedListener(searchTextWatcher);

        DisplayMetrics displaymetrics = new DisplayMetrics();
        parentActivity.getWindowManager().getDefaultDisplay().getMetrics(displaymetrics);
        final int softKeyboardHeight = displaymetrics.heightPixels / 5;

        // http://stackoverflow.com/a/9108219
        final View activityRootView = parentActivity.findViewById(R.id.select_station_layout);
        activityRootView.getViewTreeObserver().addOnGlobalLayoutListener(
                new ViewTreeObserver.OnGlobalLayoutListener() {
                    @Override
                    public void onGlobalLayout() {
                        Rect r = new Rect();
                        //r will be populated with the coordinates of your view
                        // that area still visible.
                        activityRootView.getWindowVisibleDisplayFrame(r);
                        int heightDiff =
                                activityRootView.getRootView().getHeight() - r.height();

                        // if more than 1/5 of display, its probably a keyboard...
                        if (heightDiff > softKeyboardHeight)
                            m_tvNotes.setVisibility(View.GONE);
                        else
                            m_tvNotes.setVisibility(View.VISIBLE);
                    }
                });

        return view;
	}
	
	public void Update(){
		if( m_tvNotes != null){
			SelectStationActivity parentActivity = (SelectStationActivity) getSherlockActivity();
			if(parentActivity.HasLimits()){
				m_tvNotes.setVisibility(View.VISIBLE);
			}
			else{
				m_tvNotes.setVisibility(View.INVISIBLE);
			}
		}
		
		if(m_oExpListAdapter != null){
			SelectStationActivity parentActivity = (SelectStationActivity) getSherlockActivity();
			m_oExpListAdapter.Update(parentActivity.GetStationList());
			m_oExpListAdapter.notifyDataSetChanged();
		}
	}
}
