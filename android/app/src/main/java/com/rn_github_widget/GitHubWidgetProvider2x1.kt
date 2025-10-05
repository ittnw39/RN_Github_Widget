package com.rn_github_widget

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.widget.RemoteViews
import com.rn_github_widget.util.NetworkUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter

class GitHubWidgetProvider2x1 : AppWidgetProvider() {

    companion object {
        private const val TAG = "GitHubWidgetProvider2x1"
        private const val MAX_DAYS = 56 // 8 weeks
        
        private val cellIds = (0 until MAX_DAYS).map { i ->
            val resId = "grid_cell_$i"
            try {
                R.id::class.java.getField(resId).getInt(null)
            } catch (e: Exception) {
                0
            }
        }.filter { it != 0 }
    }

    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        appWidgetIds.forEach { updateAppWidget(context, appWidgetManager, it) }
    }

    override fun onAppWidgetOptionsChanged(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle?) {
        updateAppWidget(context, appWidgetManager, appWidgetId)
    }

    @SuppressLint("RemoteViewLayout")
    private fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
        val views = RemoteViews(context.packageName, R.layout.github_widget_2x1)
        val requestCode = appWidgetId

        // Setup main activity launch
        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)?.apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val mainActivityPendingIntent = PendingIntent.getActivity(
            context.applicationContext,
            requestCode + 10001,
            launchIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
        views.setOnClickPendingIntent(R.id.widget_root, mainActivityPendingIntent)

        // Initialize grid
        initializeGrid(views)
        appWidgetManager.updateAppWidget(appWidgetId, views)

        // Load and update data in background
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val data = GitHubDataManager.getSavedContributionData(context)
                if (data.isNotEmpty()) {
                    updateContributionGrid(views, data)
                    appWidgetManager.updateAppWidget(appWidgetId, views)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to update widget", e)
            }
        }
    }

    private fun initializeGrid(views: RemoteViews) {
        cellIds.forEach { cellId ->
            try {
                views.setInt(cellId, "setBackgroundColor", Color.parseColor("#EEEEEE"))
            } catch (e: Exception) {}
        }
    }

    private fun updateContributionGrid(views: RemoteViews, contributionsData: Map<String, Int>) {
        val today = LocalDate.now()
        val formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")
        val numRows = 7
        val numCols = (MAX_DAYS + numRows - 1) / numRows

        if (cellIds.size < MAX_DAYS) return

        cellIds.forEach { cellId ->
            try {
                views.setInt(cellId, "setBackgroundColor", Color.parseColor("#EEEEEE"))
            } catch (e: Exception) {}
        }

        val startOfWeek = DayOfWeek.MONDAY

        for (dayIndex in 0 until MAX_DAYS) {
            val currentDate = today.minusDays(dayIndex.toLong())
            val dateStr = currentDate.format(formatter)
            val contributions = contributionsData[dateStr] ?: 0

            val dayOfWeekValue = currentDate.dayOfWeek.value
            val row = (dayOfWeekValue - startOfWeek.value + 7) % 7

            val weeksAgo = java.time.temporal.ChronoUnit.WEEKS.between(
                currentDate.with(startOfWeek),
                today.with(startOfWeek)
            ).toInt()
            val col = (numCols - 1) - weeksAgo

            val cellIndex = col * numRows + row

            if (col >= 0 && cellIndex >= 0 && cellIndex < cellIds.size) {
                val cellId = cellIds[cellIndex]
                try {
                    val color = getContributionColor(contributions)
                    views.setInt(cellId, "setBackgroundColor", color)
                } catch (e: Exception) {
                    Log.e(TAG, "Error setting color", e)
                }
            }
        }
    }

    private fun getContributionColor(contributions: Int): Int {
        return Color.parseColor(when {
            contributions == 0 -> "#EEEEEE"
            contributions < 3 -> "#9BE9A8"
            contributions < 5 -> "#40C463"
            contributions < 10 -> "#30A14E"
            else -> "#216E39"
        })
    }
}

