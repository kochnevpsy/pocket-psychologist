package com.pocket_psychologist;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentValues;
import android.content.DialogInterface;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.os.Bundle;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.view.Window;
import android.content.Intent;
import android.content.Context;
import android.print.PrintManager;
import android.print.PrintDocumentAdapter;
import android.print.PrintAttributes;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.JsResult;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.net.Uri;
import android.util.Base64;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private WebView mWebView;
    private static final int REQ_SAVE_CHART_IMAGE = 501;
    private byte[] pendingChartImageBytes = null;
    private String pendingChartImageName = null;

    private int designThemeColor(String theme) {
        return "dark".equals(theme) ? 0xFF121713 : 0xFFF3F0E8;
    }

    private void applyDesignThemeBackground(String theme) {
        int color = designThemeColor(theme);
        try {
            getWindow().getDecorView().setBackgroundColor(color);
        } catch (Exception e) {}
        if (mWebView != null) {
            mWebView.setBackgroundColor(color);
        }
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void setDesignTheme(final String theme) {
            final String normalized = "dark".equals(theme) ? "dark" : "light";
            try {
                getSharedPreferences("pocket_psy_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putString("design_theme", normalized)
                    .apply();
            } catch (Exception e) {}
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    applyDesignThemeBackground(normalized);
                }
            });
        }

        @JavascriptInterface
        public void printPdf() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    checkPermissionAndPrint();
                }
            });
        }

        @JavascriptInterface
        public void shareResults(final String text) {
            shareResultsWithImage(text, null);
        }

        @JavascriptInterface
        public void shareResultsWithImage(final String text, final String base64Png) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        Intent sendIntent = new Intent(Intent.ACTION_SEND);
                        sendIntent.putExtra(Intent.EXTRA_SUBJECT, "\u041A\u0430\u0440\u043C\u0430\u043D\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433");
                        sendIntent.putExtra(Intent.EXTRA_TEXT, text);

                        if (base64Png != null && base64Png.length() > 50) {
                            try {
                                String clean = base64Png;
                                int comma = clean.indexOf(",");
                                if (comma >= 0) {
                                    clean = clean.substring(comma + 1);
                                }
                                byte[] bytes = Base64.decode(clean, Base64.DEFAULT);
                                File imgFile = new File(getCacheDir(), "table.png");
                                FileOutputStream fos = new FileOutputStream(imgFile);
                                fos.write(bytes);
                                fos.flush();
                                fos.close();

                                Uri uri = Uri.parse("content://com.pocket_psychologist.fileprovider/table.png");
                                sendIntent.setType("image/png");
                                sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
                                sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                            } catch (Exception ex) {
                                sendIntent.setType("text/plain");
                            }
                        } else {
                            sendIntent.setType("text/plain");
                        }

                        Intent shareIntent = Intent.createChooser(sendIntent, "\u041F\u043E\u0434\u0435\u043B\u0438\u0442\u044C\u0441\u044F");
                        startActivity(shareIntent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void saveImageToDownloads(final String base64Png, final String filename) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        String clean = base64Png != null ? base64Png : "";
                        int comma = clean.indexOf(",");
                        if (comma >= 0) clean = clean.substring(comma + 1);
                        byte[] bytes = Base64.decode(clean, Base64.DEFAULT);
                        String fname = (filename != null && !filename.isEmpty()) ? filename : ("sondi_charts_" + System.currentTimeMillis() + ".png");

                        if (Build.VERSION.SDK_INT >= 29) {
                            saveImageToDownloadsApi29(bytes, fname);
                            Toast.makeText(MainActivity.this, "Схемы сохранены в Загрузки", Toast.LENGTH_SHORT).show();
                        } else if (checkSelfPermission(Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                            pendingChartImageBytes = bytes;
                            pendingChartImageName = fname;
                            requestPermissions(new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, REQ_SAVE_CHART_IMAGE);
                        } else {
                            saveImageToDownloadsLegacy(bytes, fname);
                            Toast.makeText(MainActivity.this, "Схемы сохранены в Загрузки", Toast.LENGTH_SHORT).show();
                        }
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "Не удалось сохранить изображение: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void shareOds(final String base64Ods, final String filename) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        String clean = base64Ods;
                        int comma = clean.indexOf(",");
                        if (comma >= 0) {
                            clean = clean.substring(comma + 1);
                        }
                        byte[] bytes = Base64.decode(clean, Base64.DEFAULT);
                        String fname = (filename != null && !filename.isEmpty()) ? filename : "PocketPsychologist_data.ods";
                        File odsFile = new File(getCacheDir(), fname);
                        FileOutputStream fos = new FileOutputStream(odsFile);
                        fos.write(bytes);
                        fos.flush();
                        fos.close();

                        Uri uri = Uri.parse("content://com.pocket_psychologist.fileprovider/" + fname);
                        Intent sendIntent = new Intent(Intent.ACTION_SEND);
                        sendIntent.putExtra(Intent.EXTRA_SUBJECT, "\u041A\u0430\u0440\u043C\u0430\u043D\u043D\u044B\u0439 \u043F\u0441\u0438\u0445\u043E\u043B\u043E\u0433 \u2014 \u0434\u0430\u043D\u043D\u044B\u0435");
                        sendIntent.putExtra(Intent.EXTRA_STREAM, uri);
                        sendIntent.setType("application/vnd.oasis.opendocument.spreadsheet");
                        sendIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                        Intent shareIntent = Intent.createChooser(sendIntent, "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0442\u0430\u0431\u043B\u0438\u0446\u0443 .ods");
                        startActivity(shareIntent);
                    } catch (Exception e) {
                        Toast.makeText(MainActivity.this, "\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                    }
                }
            });
        }

        @JavascriptInterface
        public void saveHistory(final String json) {
            try {
                getSharedPreferences("pocket_psy_prefs", Context.MODE_PRIVATE)
                    .edit()
                    .putString("test_history", json)
                    .apply();
            } catch (Exception e) {}
        }

        @JavascriptInterface
        public String getHistory() {
            try {
                return getSharedPreferences("pocket_psy_prefs", Context.MODE_PRIVATE)
                    .getString("test_history", "[]");
            } catch (Exception e) {
                return "[]";
            }
        }
    }

    private void saveImageToDownloadsApi29(byte[] bytes, String filename) throws Exception {
        ContentValues values = new ContentValues();
        values.put("display_name", filename);
        values.put("mime_type", "image/png");
        values.put("relative_path", Environment.DIRECTORY_DOWNLOADS);
        Uri uri = getContentResolver().insert(Uri.parse("content://media/external/downloads"), values);
        if (uri == null) throw new Exception("Не удалось создать файл в Загрузках");
        try (OutputStream os = getContentResolver().openOutputStream(uri)) {
            if (os == null) throw new Exception("Не удалось открыть файл");
            os.write(bytes);
            os.flush();
        }
    }

    @SuppressWarnings("deprecation")
    private void saveImageToDownloadsLegacy(byte[] bytes, String filename) throws Exception {
        File downloads = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
        if (!downloads.exists() && !downloads.mkdirs()) throw new Exception("Не удалось создать папку Загрузки");
        File file = new File(downloads, filename);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(bytes);
            fos.flush();
        }
        MediaScannerConnection.scanFile(this, new String[]{file.getAbsolutePath()}, new String[]{"image/png"}, null);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_SAVE_CHART_IMAGE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED
                    && pendingChartImageBytes != null && pendingChartImageName != null) {
                try {
                    saveImageToDownloadsLegacy(pendingChartImageBytes, pendingChartImageName);
                    Toast.makeText(this, "Схемы сохранены в Загрузки", Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    Toast.makeText(this, "Не удалось сохранить изображение: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            } else {
                Toast.makeText(this, "Нет разрешения на сохранение в Загрузки", Toast.LENGTH_LONG).show();
            }
            pendingChartImageBytes = null;
            pendingChartImageName = null;
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        String savedTheme = getSharedPreferences("pocket_psy_prefs", Context.MODE_PRIVATE)
            .getString("design_theme", "dark");
        applyDesignThemeBackground(savedTheme);
        setImmersiveMode();

        mWebView = new WebView(this);
        mWebView.clearCache(true);
        mWebView.setBackgroundColor(designThemeColor(savedTheme));
        setContentView(mWebView);

        WebSettings settings = mWebView.getSettings();
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMediaPlaybackRequiresUserGesture(false);

        mWebView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");

        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url != null && (url.startsWith("tg:") || url.startsWith("https://") || url.startsWith("http://") || url.startsWith("mailto:")) && !url.contains("file:///android_asset")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("\u041F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435")
                    .setMessage(message)
                    .setPositiveButton("\u0414\u0430", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            result.confirm();
                        }
                    })
                    .setNegativeButton("\u041E\u0442\u043C\u0435\u043D\u0430", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            result.cancel();
                        }
                    })
                    .setCancelable(false)
                    .create()
                    .show();
                return true;
            }

            @Override
            public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setTitle("\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435")
                    .setMessage(message)
                    .setPositiveButton("OK", new DialogInterface.OnClickListener() {
                        public void onClick(DialogInterface dialog, int which) {
                            result.confirm();
                        }
                    })
                    .setCancelable(false)
                    .create()
                    .show();
                return true;
            }
        });

        mWebView.loadUrl("file:///android_asset/index.html");
    }

    private void checkPermissionAndPrint() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            try {
                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (printManager != null) {
                    PrintDocumentAdapter adapter;
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                        adapter = mWebView.createPrintDocumentAdapter("Pocket_Psychologist");
                    } else {
                        adapter = mWebView.createPrintDocumentAdapter();
                    }
                    PrintAttributes.Builder builder = new PrintAttributes.Builder();
                    builder.setColorMode(PrintAttributes.COLOR_MODE_COLOR);
                    builder.setMediaSize(PrintAttributes.MediaSize.ISO_A4);
                    printManager.print("Pocket_Psychologist", adapter, builder.build());
                }
            } catch (Exception e) {
                Toast.makeText(this, "Print error: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            setImmersiveMode();
        }
    }

    @SuppressWarnings("deprecation")
    private void setImmersiveMode() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                getWindow().getDecorView().setSystemUiVisibility(
                    android.view.View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | android.view.View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | android.view.View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                );
            }
        } catch (Exception e) {}
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (mWebView == null) {
            moveTaskToBack(true);
            return;
        }

        // Let the web app close the top modal / leave a subview first.
        // Only the literal "exit" result minimizes the whole app.
        mWebView.evaluateJavascript(
            "(function(){try{return window.handleAndroidBack?window.handleAndroidBack():'exit';}catch(e){return 'exit';}})()",
            value -> {
                if (value == null || value.contains("exit")) {
                    moveTaskToBack(true);
                }
            }
        );
    }
}