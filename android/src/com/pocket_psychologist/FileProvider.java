package com.pocket_psychologist;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;

public class FileProvider extends ContentProvider {
    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        String filename = uri.getLastPathSegment();
        if (filename == null || filename.isEmpty()) {
            filename = "table.png";
        }
        File file = new File(getContext().getCacheDir(), filename);
        if (file.exists()) {
            return ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        }
        throw new FileNotFoundException("File not found: " + uri);
    }

    @Override
    public String getType(Uri uri) {
        String name = uri.getLastPathSegment();
        if (name != null) {
            if (name.endsWith(".ods")) return "application/vnd.oasis.opendocument.spreadsheet";
            if (name.endsWith(".txt")) return "text/plain";
            if (name.endsWith(".png")) return "image/png";
        }
        return "application/octet-stream";
    }

    @Override
    public Cursor query(Uri u, String[] p, String s, String[] sa, String o) { return null; }
    @Override
    public Uri insert(Uri u, ContentValues v) { return null; }
    @Override
    public int delete(Uri u, String s, String[] sa) { return 0; }
    @Override
    public int update(Uri u, ContentValues v, String s, String[] sa) { return 0; }
}