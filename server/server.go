package server

import (
	"os"

	"github.com/gin-gonic/gin"
)

func start_server() {
	port := os.Getenv("PORT")
	// Initializing the gin with the default and the PORT above
	router := gin.Default()

	// Initializing the routes
	router.GET("/content", getContent)
	router.GET("/echo", getMessage)
	router.Run(":" + port)
}