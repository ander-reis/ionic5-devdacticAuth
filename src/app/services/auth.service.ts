import {Injectable} from '@angular/core';
import {Storage} from '@ionic/storage';
import {HttpClient} from '@angular/common/http';
import {Platform} from '@ionic/angular';
import {Router} from '@angular/router';
import {BehaviorSubject, from, Observable} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {JwtHelperService} from '@auth0/angular-jwt';

const helper = new JwtHelperService();
const TOKEN_KEY = 'jwt-token';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    public user: Observable<any>;
    private userData = new BehaviorSubject(null);

    constructor(private storage: Storage, private http: HttpClient, private plt: Platform, private router: Router) {
        this.loadStoredToken();
    }

    loadStoredToken() {
        const platformObs = from(this.plt.ready());

        this.user = platformObs.pipe(
            switchMap(() => {
                return from(this.storage.get(TOKEN_KEY));
            }),
            map(token => {
                if (token) {
                    const decoded = helper.decodeToken(token);
                    this.userData.next(decoded);
                    return true;
                } else {
                    return null;
                }
            })
        );
    }

    login(credentials: { username: string, password: string }) {

        return this.http.post('http://localhost:8000/api/login', credentials).pipe(
            take(1),
            map((res: {success, token}) => {
                console.log(res);
                // Extract the JWT, here we just fake it
                return res.token;
            }),
            switchMap(token => {
                const decoded = helper.decodeToken(token);
                this.userData.next(decoded);

                const storageObs = from(this.storage.set(TOKEN_KEY, token));
                return storageObs;
            })
        );
    }

    getUser() {
        return this.userData.getValue();
    }

    logout() {
        this.storage.remove(TOKEN_KEY).then(() => {
            this.router.navigateByUrl('/');
            this.userData.next(null);
        });
    }
}
