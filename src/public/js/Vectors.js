class vec4{
    constructor(x,y,z){
        if(Array.isArray(x)){
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
            this.w = 1.0;
        }
        else{
            this.x = x;
            this.y = y;
            this.z = z;
            this.w = 1.0;
        }
    }
}

const Vec4 = {
    Add: (v1,v2) => {
        return new vec4(v1.x + v2.x , v1.y + v2.y , v1.z + v2.z);
    },
    //From where -> to where
    Sub: (v1,v2) => {
        return new vec4(v2.x - v1.x , v2.y - v1.y , v2.z - v1.z);
    },
    Mul: (v,s) => {
        return new vec4(v.x * s , v.y * s , v.z * s);
    },
    Div: (v,d) => {
        return new vec4(v.x / d , v.y / d , v.z / d);
    },
    Length: (v1) => {
        return Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    },
    Normalise: (v) =>{
        const l = Vec4.Length(v);
        return Vec4.Div(v,l);
    },
    Dot: (v1,v2) => {
        return new vec4(v1.x * v2.x , v1.y * v2.y , v1.z * v2.z);
    },
    Cross: (v1,v2) => {
        return new vec4(
            (v1.y * v2.z - v1.z * v2.y),
            (v1.z * v2.x - v1.x * v2.z),
            (v1.x * v2.y - v1.y * v2.x)
        );
    }
};

class vec3{
    constructor(x,y,z){
        if(Array.isArray(x)){
            this.x = x[0];
            this.y = x[1];
            this.z = x[2];
        }
        else{
            this.x = x;
            this.y = y;
            this.z = z;
        }
    }
}

const Vec3 = {
    Add: (v1,v2) => {
        return new vec3(v1.x + v2.x , v1.y + v2.y , v1.z + v2.z);
    },
    //From where -> to where
    Sub: (v1,v2) => {
        return new vec3(v2.x - v1.x , v2.y - v1.y , v2.z - v1.z);
    },
    Mul: (v,s) => {
        return new vec3(v.x * s , v.y * s , v.z * s);
    },
    Div: (v,d) => {
        return new vec3(v.x / d , v.y / d , v.z / d);
    },
    Length: (v1) => {
        return Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
    },
    Normalise: (v) =>{
        const l = Vec3.Length(v);
        return Vec3.Div(v,l);
    },
    Dot: (v1,v2) => {
        return new vec3(v1.x * v2.x , v1.y * v2.y , v1.z * v2.z);
    },
    Cross: (v1,v2) => {
        return new vec3(
            (v1.y * v2.z - v1.z * v2.y),
            (v1.z * v2.x - v1.x * v2.z),
            (v1.x * v2.y - v1.y * v2.x)
        );
    }
};

class vec2{
    constructor(x,y){
        if(Array.isArray(x)){
            this.x = x[0];
            this.y = x[1];
        }
        else{
            this.x = x;
            this.y = y;
        }
    }
}

const Vec2 = {
    Add: (v1,v2) => {
        return new vec3(v1.x + v2.x , v1.y + v2.y );
    },
    //From where -> to where
    Sub: (v1,v2) => {
        return new vec3(v2.x - v1.x , v2.y - v1.y );
    },
    Mul: (v,s) => {
        return new vec3(v.x * s , v.y * s );
    },
    Div: (v,d) => {
        return new vec3(v.x / d , v.y / d );
    },
    Length: (v1) => {
        return Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    },
    Normalise: (v) =>{
        const l = Vec3.Length(v);
        return Vec3.Div(v,l);
    },
    Dot: (v1,v2) => {
        return new vec3(v1.x * v2.x , v1.y * v2.y);
    },
    Cross: (v1,v2) => { 
            return (v1.x * v2.y - v1.y * v2.x)
    }
};