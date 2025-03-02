const CLOUDINARY_URL = 'yourapikey';
const UPLOAD_PRESET = 'youruploaded_preset';

export const uploadImageToCloudinary = async (imageUri) => {
  try {
    // Create form data
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image';

    // Append the file
    formData.append('file', {
      uri: imageUri,
      name: filename,
      type,
    });

    // Append upload preset
    formData.append('upload_preset', UPLOAD_PRESET);

    // Make the upload request
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    // Return the secure URL of the uploaded image
    return data.secure_url;
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

// Function to validate image before upload
export const validateImage = (imageUri) => {
  if (!imageUri) {
    throw new Error('No image selected');
  }

  const filename = imageUri.split('/').pop();
  const match = /\.(\w+)$/.exec(filename.toLowerCase());
  
  if (!match) {
    throw new Error('Invalid file format');
  }

  const extension = match[1];
  const validExtensions = ['jpg', 'jpeg', 'png'];
  
  if (!validExtensions.includes(extension)) {
    throw new Error('Invalid file format. Please upload JPG or PNG images only.');
  }

  return true;
};

// Function to optimize image URI for upload
export const prepareImageUri = (uri) => {
  // Handle file:// protocol for iOS
  return Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
};
