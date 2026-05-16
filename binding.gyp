{
  "targets": [
    {
      "target_name": "paste",
      "sources": ["native/paste.mm"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "link_settings": {
        "libraries": ["-framework CoreGraphics", "-framework AppKit"]
      },
      "xcode_settings": {
        "OTHER_CPLUSPLUSFLAGS": ["-std=c++17"]
      }
    }
  ]
}
