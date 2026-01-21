import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PauseScreen } from './pause-screen';

describe('PauseScreen', () => {
  let component: PauseScreen;
  let fixture: ComponentFixture<PauseScreen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PauseScreen]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PauseScreen);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
