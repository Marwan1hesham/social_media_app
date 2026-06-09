const clientIo = io("http://localhost:3000", {
  auth: {
    authorization: `bearer ${localStorage.getItem("authorization")}`,
  },
});

clientIo.emit("sayHi", "Hello server");

clientIo.on("connect_error", (error) => {
  console.log(error);
});
