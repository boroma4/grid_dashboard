import React, {ChangeEvent, Dispatch, FunctionComponent, SetStateAction, useEffect, useState} from 'react';
import PlotlyChart from 'react-plotlyjs-ts';
import {getChargers, getPoints} from "../Services/APIRequester";
import Container from '@material-ui/core/Container';
import {NativeSelect, Typography} from "@material-ui/core";
import {point} from "leaflet";


interface OwnProps {
    setSelectedGrid: Function,
    selectedGrid:GridData|undefined,
    focused:boolean,
    setFocused:Dispatch<SetStateAction<boolean>>,
    chargers: Array<ChargerData>,
    setChargers: Function
}

export interface GridData{
    lat:number,
    lon: number,
    address: string,
    time: number,
    predictedLoad: number,
    isOverloaded: string,
    baseLoad: number,
    maxLoad: number,
    cadaster: string,
    [key: string]: any
}

export interface ChargerData {
    lon: number,
    lat: number,
    carModel: string,
    chargeNeed: number,
    optimizedCharge: number,
    address: string,
    cadaster: string,
    decreasePercent: number
}

const times:Array<number> = Array.from({length: 24}, (_, i) => i + 1);

type Props = OwnProps;

const Dashboard: FunctionComponent<Props> = ({setSelectedGrid,focused,setFocused, chargers, setChargers}: OwnProps) => {
    const [time, setTime] = useState<number>(12);

    const [dataPoints, setDataPoints] = useState<Array<GridData>>([]);

    const [lat, setLat] = useState<Array<number>>([]);
    const [lon, setLon] = useState<Array<number>>([]);
    const [colors, setColors] = useState<Array<string>>(['black']);

    const [centerPoint, setCenterPoint] = useState<Array<number>|undefined>(undefined);



    const getBy = (dataset:Array<any>,key:string) => {
        return dataset.map(point => {return point[key]})
    };

    const getColors = () => {
        return dataPoints.map(point => {
            if(point['isOverloaded'] === 'True'){
                if(point.baseLoad < point.maxLoad) return 'red';
                return 'purple';
            }
            return 'blue';
        })
    };

    const average = (nums:Array<number>) => {
        return nums.reduce((a, b) => (a + b),0) / nums.length;
    };

    const loadTime = (event:ChangeEvent<HTMLSelectElement>) => {
        setTime(+event.target.value);
        setSelectedGrid(undefined);
        getPoints(time,setDataPoints).then(()=> setFocused(false));
    };

    const handleOverloadedClick = (idx:number) => {
        let point = dataPoints[idx];
        let color = colors[idx];

        setChargers([]);
        if (color === 'red' || color === 'purple'){
            getChargers(point.time,point.cadaster,point.baseLoad,point.maxLoad, setChargers);
            setCenterPoint([point.lat,point.lon]);
            setFocused(true);
        }
        setSelectedGrid(point);

    };

    const loadGlobalMap = () => {
        let lat_a = getBy(dataPoints,'lat');
        let lon_a = getBy(dataPoints,'lon');
        let colors_a = getColors();

        setLat(lat_a);
        setLon(lon_a);
        setColors(colors_a);
        setCenterPoint([average(lat_a),average(lon_a)]);
    };


    useEffect(()=>{
        getPoints(time,setDataPoints);
    },[]);

    useEffect(()=>{
        loadGlobalMap();
    },[dataPoints]);

    useEffect(()=>{
        if (focused && centerPoint){
            let lat_a = getBy(chargers,'lat');
            let lon_a = getBy(chargers,'lon');
            let colors_a = Array.from({length: lat_a.length}, (_, i) => "green");

            lat_a.push(centerPoint[0]);
            lon_a.push(centerPoint[1]);
            colors_a.push("red");
            setLat(lat_a);
            setLon(lon_a);
            setColors(colors_a);
        }else{
            loadGlobalMap()
        }

    },[chargers,focused]);

    if (focused){
        return (chargers && centerPoint)?
            (<Container>
                <Typography variant={"h5"}>Please, select time of the day</Typography>
                <NativeSelect
                    value={time}
                    style={{margin:"8vh",backgroundColor:"white",width:"8vw"}}
                    onChange={(event)=>{loadTime(event)}}
                    inputProps={{
                        name: 'time',
                        id: 'age-native-label-placeholder',
                    }}
                >
                    {times.map( (t,idx) => {
                        return <option key={idx} value={t}>{t}</option>
                    })}
                </NativeSelect>

                <Container>
                    <PlotlyChart
                        data={[
                            {
                                type: "scattermapbox",
                                lon: lon,
                                lat: lat,
                                marker: { color: colors, size: 10 }
                            }
                        ]}
                        layout={
                            {
                                dragmode: "zoom",
                                mapbox: { style: "open-street-map", center: { lat: centerPoint[0], lon: centerPoint[1] }, zoom: 13 },
                                margin: { r: 0, t: 0, b: 0, l: 0 }
                            }
                        }
                        onClick={()=>{}}
                        onHover={()=>{}}

                    />
                </Container>
            </Container>)
            :
            (<></>);
    }else{
        return (
            (lat && lon && centerPoint)?
                (
                    <Container>
                        <Typography variant={"h5"}>Please, select time of the day</Typography>
                        <NativeSelect
                            value={time}
                            style={{margin:"8vh",backgroundColor:"white",width:"8vw"}}
                            onChange={(event)=>{loadTime(event)}}
                            inputProps={{
                                name: 'time',
                                id: 'age-native-label-placeholder',
                            }}
                        >
                            {times.map( (t,idx) => {
                                return <option key={idx} value={t}>{t}</option>
                            })}
                        </NativeSelect>
                        <Container>
                            <PlotlyChart
                                data={[
                                    {
                                        type: "scattermapbox",
                                        lon: lon,
                                        lat: lat,
                                        marker: { color: colors, size: 10 }
                                    }
                                ]}
                                layout={
                                    {
                                        dragmode: "zoom",
                                        mapbox: { style: "open-street-map", center: { lat: centerPoint[0], lon: centerPoint[1] }, zoom: 11 },
                                        margin: { r: 0, t: 0, b: 0, l: 0 }
                                    }
                                }
                                onClick={(event)=>{handleOverloadedClick(event.points[0].pointIndex)}}
                                onHover={()=>{}}

                            />
                        </Container>
                    </Container>
                )
                :
                (<></>)

        );
    }
};

export default Dashboard;

