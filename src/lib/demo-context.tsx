import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService, circleService } from '@/lib/services';
import type { Circle, Role, User } from '@/lib/types';
interface DemoContextValue {user:User|null;circle:Circle|null;role:Role;switchRole:(role:Role)=>void;dark:boolean;toggleTheme:()=>void}
const DemoContext=createContext<DemoContextValue|null>(null);
const roles:Role[]=['Committee Admin','Member','Guarantor','Auditor'];
export function DemoProvider({children}:{children:ReactNode}){const [role,setRole]=useState<Role>('Committee Admin');const [user,setUser]=useState<User|null>(null);const [circle,setCircle]=useState<Circle|null>(null);const [dark,setDark]=useState(false);const [ready,setReady]=useState(false);
useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('qard-demo')??'{}');if(roles.includes(saved.role))setRole(saved.role);setDark(saved.dark===true)}catch{}setReady(true);circleService.getActive().then(setCircle)},[]);
useEffect(()=>{let current=true;authService.getDemoUser(role).then(u=>{if(current)setUser(u)});return()=>{current=false}},[role]);
useEffect(()=>{document.documentElement.classList.toggle('dark',dark);if(ready)localStorage.setItem('qard-demo',JSON.stringify({role,dark,circleId:circle?.id}))},[role,dark,ready,circle]);
return <DemoContext.Provider value={{user,circle,role,switchRole:setRole,dark,toggleTheme:()=>setDark(v=>!v)}}>{children}</DemoContext.Provider>}
export function useDemo(){const context=useContext(DemoContext);if(!context)throw new Error('DemoProvider required');return context}
