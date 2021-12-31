package main

import (
	"fmt"
	"os"

	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gocolly/colly/v2"
)

func getContent(c *gin.Context) {
	var url string = c.Query("url")
	var statusCode int
	var titles []string 
	

	collector := colly.NewCollector()

	collector.OnHTML("div.animes p.animetitles", func(e *colly.HTMLElement) {
		titles = append(titles, e.Text) 
	})

	collector.OnResponse(func(r *colly.Response) {
		statusCode = r.StatusCode
	})

	collector.OnError(func(r *colly.Response, err error) {
		statusCode = r.StatusCode
	})

	collector.Visit(url)
	c.JSON(statusCode, gin.H{"animes": titles})
}

func getMessage(c *gin.Context) {
	var message string = c.Query("message")
	c.String(http.StatusOK, message)
}

func main() {
	port := os.Getenv("PORT")
	// Initializing the routes
	router := gin.Default()
	router.GET("/content", getContent)
	router.GET("/echo", getMessage)
	router.Run(fmt.Sprintf("localhost:%s", port))
}