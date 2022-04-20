import '../style/main.scss'
import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import * as d3Dsv from 'd3-dsv'
import * as d3Fetch from 'd3-fetch'
import * as d3Color from 'd3-color'
import * as d3Dispatch from 'd3-dispatch'
import * as d3Transition from 'd3-transition'
import * as d3Slider from 'd3-simple-slider'
const d3=Object.assign({},d3Selection,d3Scale,d3Dispatch,d3Transition,d3Dsv,d3Fetch,d3Slider,d3Color);


const   size= { width:1000, height:300 };
let     finalistes=new Array(),
        candidats=new Array();

class Candidat {
    constructor( id, voix, score, nom, prenom, couleur ){
        this.id=id;
        this.voix=voix;
        this.score=score;
        this.nom=nom;
        this.prenom=nom;
        this.couleur=couleur;
    }
}

class Finaliste extends Candidat{
    constructor(...args){
        super(args);
    }
}






function update(){
    const formatPercent=(pct)=> pct.toLocaleString('fr-FR')+'%';
    const updatePict=(index)=> d3.select('img#pdt').attr('src',`./assets/img/${finalistes[index].id}.jpg`);
    for (let i=0;i<2;i++){
        finalistes[i].total=finalistes[i].voix;
        for (let j=0;j<candidats.length;j++){
            // console.log(candidats[j].valueA);
            if (candidats[j].hasOwnProperty('value') && !isNaN(candidats[j].value[i])) finalistes[i].total+=Math.round(candidats[j].voix*candidats[j].value[i]/100);
        }
        d3.select(`#fin${i} p.voix`).text(`${finalistes[i].total.toLocaleString('fr-FR')} voix`);
    }
    let percent=[Math.round(1000*finalistes[0].total/(finalistes[0].total+finalistes[1].total))/10];
    d3.select('#fin0 p.score').text(formatPercent(percent[0]));
    percent[1]=100-percent[0];
    d3.select('#fin1 p.score').text(formatPercent(percent[1]));

    d3.select('div#bck').style('width',`${percent[0]}%`);
    if (percent[0]>=50) updatePict(0);
    else updatePict(1);

}


function initFinaliste(index){
    let f = finalistes[index];
    f.couleurB=d3.color(finalistes[index].couleur).copy({opacity:.3}).formatRgb();
    const elt=d3.select('#main-slider div.dummy').clone(true).attr('id',`fin${index}`).classed('dummy',false).raise();
    elt.select('p.score').style('color',f.couleur);
    elt.select('p.prenom').text(f.prenom);
    elt.select('p.nom').text(f.nom);
}


function createSlider(index){

    const   delay=100,
            slider = { width :size.width/3, height: 70, fontSize: 20},
            thumb = { width:200},
            dx = d3.scaleLinear().domain([10,0]).range([0,-slider.fontSize]).clamp(true);

    let c = candidats[index];

    c.li= d3.select('li.dummy').clone(true).attr('id','cand'+index).raise();
    c.svg = c.li.select(`svg`).attr('viewBox',`0 0 ${size.width} ${size.height}`) ;
    c.slider = new Array();
    c.container = new Array();
    c.value = new Array();
    c.valueText = new Array();

    for (let j=0;j<2;j++){
        c.slider[j] = d3.sliderBottom()
                        .step(1)
                        .value(0.1)
                        .width(slider.width)
                        .tickFormat( d=> `${Math.round(d)}%`)
                        .displayValue(true);
        c.container[j] = c.svg.append('g').classed(`slider${j}`,true).call(c.slider[j]);
        c.container[j].select('line.track').style('stroke','transparent').style('stroke-width',slider.height);
        c.container[j].select('line.track-inset').attr('x1',slider.width*(1-j)).attr('x2',slider.width*(1-j))
                        .style('stroke',finalistes[j].couleur)
                        .attr('stroke-width',slider.height)
                        .attr('stroke-linecap','square')
                        .attr('stroke-linejoin','miter');
                      /*  .clone()
                            .attr('class','track-bkg').lower()
                            .style('stroke-linecap','square')
                            .style('stroke','#eee').style('fill','#eee').style('stroke-width',slider.height+20)*/
        c.container[j].select('g.parameter-value').raise()
                        .select('text').attr('y',slider.fontSize).attr('dy',-slider.fontSize/2);
        c.valueText[j]=c.container[j].append('text').classed('nbvoix',true)
                                    .attr('y',slider.fontSize*1.5+slider.height/2)
                                    .text('0 voix')
                                    .style('fill',finalistes[j].couleur).style('font-size',slider.fontSize);
    }

    c.container[0].attr('transform',`translate(${ (size.width-thumb.width)/2-slider.width} ${slider.fontSize*7})`);
    c.valueText[0].attr('x',size.width/2-slider.width/2.5);
    c.slider[0].domain([100,0])
                .on('onchange', (val) => {
                    c.value[0]=Math.round(val);
                    c.container[0].select('g.parameter-value text').attr('dx',d=> dx(c.value[0]) );
                    c.container[0].select('line.track-inset').attr('x1',slider.width-slider.width*c.value[0]/100);
                    c.valueText[0].text(`${(c.value[0])?'+':''} ${Math.round(c.value[0]*c.voix/100).toLocaleString('fr-FR')} voix`);
                    const sum=c.value[0]+c.value[1];
                    if (sum>100) c.slider[1].value(c.value[1]-sum+100);
                    update();
                }).value(0);

    c.container[1].attr('transform',`translate(${ (size.width+thumb.width)/2} ${slider.fontSize*7})`);
    c.valueText[1].attr('x',-slider.height/2+5);
    c.slider[1].domain([0,100])
                .on('onchange', (val) => {
                    c.value[1]=Math.round(val);
                    c.container[1].select('g.parameter-value text').attr('dx',d=> -dx(c.value[1]) );
                    c.container[1].select('line.track-inset').attr('x2',slider.width*c.value[1]/100);
                    c.valueText[1].text(`${(c.value[1])?'+':''} ${Math.round(c.value[1]*c.voix/100).toLocaleString('fr-FR')} voix`);
                    const sum=c.value[0]+c.value[1];
                    if (sum>100) c.slider[0].value(c.value[0]-sum+100);
                    update();
                })
                .value(0);

    const titre=c.svg.append('g');
    titre.append('text')
            .classed('titre',true)
            .attr('x',size.width/2).attr('y',slider.fontSize*2)
            .text(`${c.prenom} ${c.nom.toUpperCase()}`)
            .style('font-size',slider.fontSize*2)
        .style('text-decoration','underline solid #eee')
        .style('text-decoration-color',c.couleur);
    titre.append('text')
        .classed('voix',true)
        .attr('x',size.width/2).attr('y',slider.fontSize*3.7)
        .text(`${c.voix.toLocaleString('fr-FR')} voix`)
        .style('font-size',slider.fontSize*1.5);
    titre.append('text')
        .classed('consigne',true)
        .attr('x',size.width/2).attr('y',slider.fontSize*13)
        .text(`Consigne de vote : ${c.consigne}`)
        .style('font-size',slider.fontSize);

    setTimeout(()=> {
        c.li.classed('dummy',false);
        }, delay*(index+1) );




}


d3.csv("./assets/data/resultats.csv",d3.autoType)
    .then((data)=> {

        finalistes=data.slice(0,2);
        candidats=data.slice(2);

        for (let i=0;i<candidats.length;i++){
            createSlider(i,candidats[i]);
        }

        for (let i=0;i<2;i++){
            initFinaliste(i);
        }

        d3.select('#main-slider').style('background',finalistes[1].couleur);
        d3.select('#main-slider').select('#bck').style('background',finalistes[0].couleur);
        update();



    });


    //slider[0].silentValue([8,88]);


    //d3.select('line.track-inset').style('stroke','red').clone().style('stroke','red');






