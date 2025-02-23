from PIL import Image

try:
    img = Image.open("cleaned_chal31.png")
    img.show()
    print("✅ PNG is valid and displayed!")
except Exception as e:
    print(f"❌ PNG is corrupted: {e}")
