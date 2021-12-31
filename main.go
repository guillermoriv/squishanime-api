package main

import (
	"fmt"

	// "net/http"

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

func main() {
	var port int = 3000
	var	path string = fmt.Sprintf("localhost:%d", port) 
	router := gin.Default()
	router.GET("/content", getContent)
	router.Run(path)
}