using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.IO;

public class ImageCropper {
    public static void AutoCrop(string inputFile, string outputFile) {
        Console.WriteLine("Processing: " + inputFile);
        using (Bitmap bmp = new Bitmap(inputFile)) {
            BitmapData bmpData = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
            int bytes = Math.Abs(bmpData.Stride) * bmp.Height;
            byte[] rgbValues = new byte[bytes];
            Marshal.Copy(bmpData.Scan0, rgbValues, 0, bytes);
            
            // Background color from top-left pixel
            byte bBg = rgbValues[0];
            byte gBg = rgbValues[1];
            byte rBg = rgbValues[2];
            
            int minX = bmp.Width, minY = bmp.Height, maxX = 0, maxY = 0;
            int stride = bmpData.Stride;
            
            for (int y = 0; y < bmp.Height; y++) {
                for (int x = 0; x < bmp.Width; x++) {
                    int offset = (y * stride) + (x * 4);
                    byte b = rgbValues[offset];
                    byte g = rgbValues[offset + 1];
                    byte r = rgbValues[offset + 2];
                    
                    // Allow threshold for artifacts
                    if (Math.Abs(b - bBg) > 10 || Math.Abs(g - gBg) > 10 || Math.Abs(r - rBg) > 10) {
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            
            bmp.UnlockBits(bmpData);
            
            if (minX <= maxX && minY <= maxY && (minX > 0 || minY > 0 || maxX < bmp.Width - 1 || maxY < bmp.Height - 1)) {
                Rectangle cropRect = new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
                using (Bitmap target = new Bitmap(cropRect.Width, cropRect.Height)) {
                    using (Graphics g = Graphics.FromImage(target)) {
                        g.DrawImage(bmp, new Rectangle(0, 0, target.Width, target.Height), 
                                         cropRect, 
                                         GraphicsUnit.Pixel);
                    }
                    target.Save(outputFile, ImageFormat.Png);
                    Console.WriteLine("Cropped successfully to " + cropRect.ToString());
                }
            } else {
                Console.WriteLine("No crop needed or empty image.");
                if (inputFile != outputFile) {
                    bmp.Save(outputFile, ImageFormat.Png);
                }
            }
        }
    }
}
