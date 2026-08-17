using System;

class Program {
    static void Main() {
        ImageCropper.AutoCrop(@"assets\quiklyy-logo-light.png", @"assets\quiklyy-logo-light.png");
        ImageCropper.AutoCrop(@"assets\quiklyy-logo-dark.png", @"assets\quiklyy-logo-dark.png");
    }
}
