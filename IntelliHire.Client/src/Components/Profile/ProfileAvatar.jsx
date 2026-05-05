export default function ProfileAvatar({ image, setImage, existingImage }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setImage(file);
  };

  const preview =
    image
      ? URL.createObjectURL(image)
      : existingImage
      ? `https://intellihire-production.up.railway.app/uploads/${existingImage}`
      : "/profile.jpg";

  return (
    <div className="flex flex-col items-center mb-6">
      <div className="relative w-28 h-28">
        <img
          src={preview}
          className="w-28 h-28 rounded-full object-cover border-2 border-[#9CBFAC]"
        />

        <label className="absolute bottom-0 right-0 bg-[#29445D] p-2 rounded-full cursor-pointer">
          <input type="file" hidden onChange={handleFileChange} />
        </label>
      </div>
    </div>
  );
}