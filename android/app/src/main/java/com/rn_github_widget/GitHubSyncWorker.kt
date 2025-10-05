package com.rn_github_widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.util.Log
import android.widget.RemoteViews
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

class GitHubSyncWorker(context: Context, workerParams: WorkerParameters) : CoroutineWorker(context, workerParams) {

    companion object {
        private const val TAG = "GitHubSyncWorker"
        private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
    }

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val currentTime = LocalDateTime.now().format(dateFormatter)
            Log.d(TAG, "백그라운드 동기화 작업 시작 - $currentTime")
            
            // Fetch contribution data
            val data = GitHubDataManager.fetchContributionData(applicationContext)
            
            if (data.isEmpty()) {
                Log.w(TAG, "No data fetched, skipping widget update")
                return@withContext Result.success()
            }
            
            // Update all widgets
            updateAllWidgets(applicationContext, data)
            
            Log.d(TAG, "백그라운드 동기화 작업 완료 - $currentTime")
            Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "백그라운드 동기화 작업 실패 - Error: ${e.message}", e)
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
    
    private fun updateAllWidgets(context: Context, data: Map<String, Int>) {
        val appWidgetManager = AppWidgetManager.getInstance(context)
        
        // Update 4x2 widgets
        val widgetIds4x2 = appWidgetManager.getAppWidgetIds(
            ComponentName(context, GitHubWidgetProvider4x2::class.java)
        )
        
        Log.d(TAG, "Updating ${widgetIds4x2.size} widgets")
        
        widgetIds4x2.forEach { widgetId ->
            try {
                val intent = android.content.Intent(context, GitHubWidgetProvider4x2::class.java).apply {
                    action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, intArrayOf(widgetId))
                }
                context.sendBroadcast(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update widget $widgetId", e)
            }
        }
    }
}

