using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public class ImageTransparency {
    public static void MakeCornersTransparent(string inputFile, string outputFile) {
        Console.WriteLine("Processing: " + inputFile);
        using (Bitmap bmp = new Bitmap(inputFile)) {
            BitmapData bmpData = bmp.LockBits(new Rectangle(0, 0, bmp.Width, bmp.Height), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int bytes = Math.Abs(bmpData.Stride) * bmp.Height;
            byte[] rgbValues = new byte[bytes];
            Marshal.Copy(bmpData.Scan0, rgbValues, 0, bytes);
            
            // Background color from top-left pixel
            byte bBg = rgbValues[0];
            byte gBg = rgbValues[1];
            byte rBg = rgbValues[2];
            
            int stride = bmpData.Stride;
            
            for (int y = 0; y < bmp.Height; y++) {
                for (int x = 0; x < bmp.Width; x++) {
                    int offset = (y * stride) + (x * 4);
                    byte b = rgbValues[offset];
                    byte g = rgbValues[offset + 1];
                    byte r = rgbValues[offset + 2];
                    
                    // Allow threshold for artifacts
                    if (Math.Abs(b - bBg) <= 25 && Math.Abs(g - gBg) <= 25 && Math.Abs(r - rBg) <= 25) {
                        rgbValues[offset + 3] = 0; // Set Alpha to 0 (Transparent)
                        rgbValues[offset] = 0;
                        rgbValues[offset + 1] = 0;
                        rgbValues[offset + 2] = 0;
                    }
                }
            }
            
            Marshal.Copy(rgbValues, 0, bmpData.Scan0, bytes);
            bmp.UnlockBits(bmpData);
            
            bmp.Save(outputFile, ImageFormat.Png);
            Console.WriteLine("Made corners transparent successfully.");
        }
    }
}
