package com.rn_github_widget;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import android.content.Context;

public class ConfigModule extends ReactContextBaseJavaModule {
    private final ReactApplicationContext reactContext;

    ConfigModule(ReactApplicationContext context) {
        super(context);
        this.reactContext = context;
    }

    @Override
    public String getName() {
        return "Config";
    }

    @ReactMethod
    public void getGithubToken(Promise promise) {
        try {
            Context context = getReactApplicationContext();
            int resId = context.getResources().getIdentifier("github_token", "string", context.getPackageName());
            String token = context.getString(resId);
            promise.resolve(token);
        } catch (Exception e) {
            promise.resolve("");
        }
    }
}

