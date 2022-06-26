const express = require('express');
const request = require('request-promise');
const cheerio=require('cheerio');
const axios=require('axios');

const app=express();
const PORT=8000 || process.env.PORT;

app.use(express.json());
const searchedMovies=[];
const movieInfo=[];

const searchCache={};
const movieCache={};

const searchMoviesUrl=`https://www.imdb.com/find?s=tt&ttype=ft&ref_=fn_ft&q=`
const movieUrl=`https://www.imdb.com/title/`

app.get('/',(req,res)=>{
    res.send("Welcome to movie details api");
});


app.get('/movie/allmovies/:name',(req,res)=>{
    const {name}=req.params;
    if(searchCache[name]){
        res.json(searchCache[name]);
    }
    axios.get(`${searchMoviesUrl}${name}`).then((response)=>{
        const html=response.data;
        const $=cheerio.load(html);

        $('.findResult',html).each((i,element)=>{
            const movieName=$(element).text();
            const title=$(element).find('td.result_text a').text();
            const poster=$(element).find('td a img').attr('src');
            const imdbId=$(element).find('td.result_text a').attr('href').match(/title\/(.*)\//)[1];
            searchedMovies.push({
                title: title,
                poster: poster,
                imdbId: imdbId
            })
        });
        searchCache[name]=searchedMovies;
        res.json(searchedMovies);
    }).catch((err)=>{
        res.json(err);
    });
});

app.get('/movie/getinfo/:imdb_Id',(req,res)=>{
    const {imdb_Id}=req.params;
    if(movieCache[imdb_Id]){
        res.json(movieCache[imdb_Id]);
    }
        axios.get(`${movieUrl}${imdb_Id}`).then((response)=>{
            const html=response.data;
            const $=cheerio.load(html);
            const title=$('h1').text();
            let year;
            let rating;
            const time=$('div.eSKKHi ul li').text().slice(12);
            $('a.sc-8c396aa2-1',html).each((i,element)=>{
                if($(element).attr('href').match(/parentalguide/)){
                    rating=$(element).text();
                }
                else if($(element).attr('href').match(/releaseinfo/)){
                    year=$(element).text();
                }
            });
            let genre=[];
            $('.sc-16ede01-3').each((i,element)=>{
                genre.push($(element).text())
            });
            const description=$('.gXUyNh').text();
            let imdbRating=$('.jGRxWM').text();
            imdbRating=imdbRating.slice(imdbRating.length/2);
            let poster=$('a.ipc-lockup-overlay').attr('href');
            poster='https://www.imdb.com'+poster;
            let storyline;
            $('.ipc-html-content-inner-div').each((i,element)=>{
                if(i==1){
                    storyline=$(element).text();
                }
            });
            const trailerlink=$('a.VideoSlate__title').attr('href');
            movieInfo.push({
                title: title,
                imbdID:imdb_Id,
                imdbRating:imdbRating,
                year:year,
                rating:rating,
                time:time,
                poster:poster,
                genre:genre,
                description:description,
                storyline:storyline,
                trailerlink:`https://www.imbd.com${trailerlink}`
            });
            movieCache[imdb_Id]=movieInfo;
            res.json(movieInfo);
        }).catch((err)=>{
            res.json(err);
        });
});

app.listen(PORT, () => console.log(`Server Running on Port: ${PORT}`));