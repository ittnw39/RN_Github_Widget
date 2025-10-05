package com.rn_github_widget

import android.content.Context
import android.content.SharedPreferences
import android.util.Log
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

/**
 * GitHub API와 통신하여 컨트리뷰션 데이터를 가져오고 저장하는 매니저
 */
object GitHubDataManager {
    private const val TAG = "GitHubDataManager"
    private const val PREFS_NAME = "github_widget_prefs"
    private const val KEY_USERNAME = "github_username"
    private const val KEY_TOKEN = "github_token"
    private const val KEY_CONTRIBUTION_DATA = "contribution_data"
    private const val KEY_LAST_UPDATE = "last_update"
    
    private const val GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
    
    private val gson = Gson()
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private fun getPrefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }
    
    fun getUsername(context: Context): String {
        return getPrefs(context).getString(KEY_USERNAME, "") ?: ""
    }
    
    fun setUsername(context: Context, username: String) {
        getPrefs(context).edit().putString(KEY_USERNAME, username).apply()
    }
    
    fun getToken(context: Context): String {
        var token = getPrefs(context).getString(KEY_TOKEN, "")
        if (token.isNullOrEmpty()) {
            // fallback to string resource
            try {
                token = context.getString(R.string.github_token)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to get token from resources", e)
            }
        }
        return token ?: ""
    }
    
    fun setToken(context: Context, token: String) {
        getPrefs(context).edit().putString(KEY_TOKEN, token).apply()
    }
    
    fun getSavedContributionData(context: Context): Map<String, Int> {
        val json = getPrefs(context).getString(KEY_CONTRIBUTION_DATA, null) ?: return emptyMap()
        val type = object : TypeToken<Map<String, Int>>() {}.type
        return try {
            gson.fromJson(json, type)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to parse saved contribution data", e)
            emptyMap()
        }
    }
    
    private fun saveContributionData(context: Context, data: Map<String, Int>) {
        val json = gson.toJson(data)
        getPrefs(context).edit()
            .putString(KEY_CONTRIBUTION_DATA, json)
            .putLong(KEY_LAST_UPDATE, System.currentTimeMillis())
            .apply()
    }
    
    suspend fun fetchContributionData(context: Context, year: Int = LocalDate.now().year): Map<String, Int> = withContext(Dispatchers.IO) {
        val username = getUsername(context)
        val token = getToken(context)
        
        if (username.isEmpty()) {
            Log.w(TAG, "Username is empty")
            return@withContext emptyMap()
        }
        
        if (token.isEmpty()) {
            Log.w(TAG, "Token is empty")
            return@withContext emptyMap()
        }
        
        try {
            val query = """
                {
                  user(login: "$username") {
                    contributionsCollection(from: "${year}-01-01T00:00:00Z", to: "${year}-12-31T23:59:59Z") {
                      contributionCalendar {
                        totalContributions
                        weeks {
                          contributionDays {
                            date
                            contributionCount
                          }
                        }
                      }
                    }
                  }
                }
            """.trimIndent()
            
            val jsonPayload = JSONObject().apply {
                put("query", query)
            }.toString()
            
            val requestBody = jsonPayload.toRequestBody("application/json".toMediaType())
            val request = Request.Builder()
                .url(GITHUB_GRAPHQL_URL)
                .addHeader("Authorization", "Bearer $token")
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build()
            
            val response = client.newCall(request).execute()
            val responseBody = response.body?.string() ?: ""
            
            if (!response.isSuccessful) {
                Log.e(TAG, "GitHub API failed: ${response.code} - $responseBody")
                return@withContext emptyMap()
            }
            
            Log.d(TAG, "GitHub API response: $responseBody")
            
            val jsonResponse = JSONObject(responseBody)
            val data = jsonResponse.optJSONObject("data")
            val user = data?.optJSONObject("user")
            val contributionsCollection = user?.optJSONObject("contributionsCollection")
            val contributionCalendar = contributionsCollection?.optJSONObject("contributionCalendar")
            val weeks = contributionCalendar?.optJSONArray("weeks")
            
            val dayMap = mutableMapOf<String, Int>()
            
            if (weeks != null) {
                for (i in 0 until weeks.length()) {
                    val week = weeks.getJSONObject(i)
                    val contributionDays = week.optJSONArray("contributionDays")
                    if (contributionDays != null) {
                        for (j in 0 until contributionDays.length()) {
                            val day = contributionDays.getJSONObject(j)
                            val date = day.getString("date")
                            val count = day.getInt("contributionCount")
                            dayMap[date] = count
                        }
                    }
                }
            }
            
            Log.d(TAG, "Fetched ${dayMap.size} days of contribution data")
            saveContributionData(context, dayMap)
            dayMap
        } catch (e: Exception) {
            Log.e(TAG, "Failed to fetch contribution data", e)
            // Return saved data as fallback
            getSavedContributionData(context)
        }
    }
}

