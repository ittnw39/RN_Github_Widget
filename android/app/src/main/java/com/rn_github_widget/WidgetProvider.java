package com.rn_github_widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;
import android.graphics.Color;
import java.util.Map;
import java.util.HashMap;

public class WidgetProvider extends AppWidgetProvider {
    
    private static final String ACTION_REFRESH = "com.rn_github_widget.ACTION_REFRESH";
    private static final String ACTION_OPEN_APP = "com.rn_github_widget.ACTION_OPEN_APP";
    
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
    
    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        
        if (ACTION_REFRESH.equals(intent.getAction())) {
            // 위젯 새로고침 로직
            int appWidgetId = intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, AppWidgetManager.INVALID_APPWIDGET_ID);
            if (appWidgetId != AppWidgetManager.INVALID_APPWIDGET_ID) {
                AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
                updateAppWidget(context, appWidgetManager, appWidgetId);
            }
        }
    }
    
    private void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
        
        // 새로고침 버튼 설정
        Intent refreshIntent = new Intent(context, WidgetProvider.class);
        refreshIntent.setAction(ACTION_REFRESH);
        refreshIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId);
        PendingIntent refreshPendingIntent = PendingIntent.getBroadcast(
            context, appWidgetId, refreshIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.refresh_button, refreshPendingIntent);
        
        // 앱 열기 버튼 설정
        Intent appIntent = new Intent(context, MainActivity.class);
        PendingIntent appPendingIntent = PendingIntent.getActivity(
            context, appWidgetId, appIntent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent);
        
        // 기본 데이터 설정
        views.setTextViewText(R.id.widget_title, "GitHub 컨트리뷰션");
        views.setTextViewText(R.id.today_contributions, "0");
        views.setTextViewText(R.id.total_contributions, "0");
        
        // 그리드 초기화
        initializeGrid(context, views);
        
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
    
    private void initializeGrid(Context context, RemoteViews views) {
        // 21개 셀을 기본 색상으로 초기화 (widget_layout.xml에 정의된 셀 개수)
        for (int i = 0; i < 21; i++) {
            int cellId = context.getResources().getIdentifier(
                "grid_cell_" + i, "id", context.getPackageName()
            );
            if (cellId != 0) {
                views.setInt(cellId, "setBackgroundColor", Color.parseColor("#EEEEEE"));
            }
        }
    }
    
    public static void updateWidgetWithData(Context context, String username, Map<String, Integer> contributions, int todayCount, int totalCount) {
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        int[] appWidgetIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, WidgetProvider.class));
        
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_layout);
            
            // 텍스트 업데이트
            views.setTextViewText(R.id.widget_title, username);
            views.setTextViewText(R.id.today_contributions, String.valueOf(todayCount));
            views.setTextViewText(R.id.total_contributions, String.valueOf(totalCount));
            
            // 그리드 업데이트
            updateContributionGrid(views, contributions, context);
            
            appWidgetManager.updateAppWidget(appWidgetId, views);
        }
    }
    
    private static void updateContributionGrid(RemoteViews views, Map<String, Integer> contributions, Context context) {
        // 컨트리뷰션 데이터를 그리드에 반영
        // 이 부분은 React Native에서 전달받은 데이터를 사용하여 구현
        // 실제 구현은 네이티브 모듈에서 처리
    }
}
